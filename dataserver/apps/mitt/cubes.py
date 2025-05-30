"""
Old cubing process

Will scan the data directory looking for new files to process for cubes
and will process them if the file has changed since its last process.

Author: Thadeus Burgess

Copyright (c) 2011 Solar Power Technologies Inc.
"""

import os
import re
import sys
import h5py
import numpy as np
from dataserver.apps.util.config import local_config
from dataserver.apps.util.logger import LoggerMixin
from dataserver.apps.util.mail import send
from dataserver.apps.util.hdf5.hdf5_util import HDF5Manager
from dataserver.apps.util.utctime import utcepochnow
from apps.mitt.cubesets import cubes as auto_cubes

config = local_config()


class FileModifiedCache:
    """HDF5-based cache for tracking processed files."""

    def __init__(self, db_path):
        self.db_path = db_path
        self.dataset_name = "cube_fmtimecache"

        # Ensure dataset exists
        with h5py.File(self.db_path, "a") as hdf:
            if self.dataset_name not in hdf:
                hdf.create_dataset(
                    self.dataset_name,
                    shape=(0,),
                    maxshape=(None,),
                    dtype=[("cubename", "S50"), ("filepath", "S255"), ("mtime", "i8")]
                )

    def find(self, cubename, filepath):
        """Check if a file is already processed."""
        with h5py.File(self.db_path, "r") as hdf:
            data = hdf[self.dataset_name][()]
            for idx, entry in enumerate(data):
                if entry["cubename"].decode() == cubename and entry["filepath"].decode() == filepath:
                    return idx
        return -1

    def add(self, cubename, filepath, mtime):
        """Add a new processed file entry."""
        with h5py.File(self.db_path, "a") as hdf:
            data = hdf[self.dataset_name]
            new_entry = np.array([(cubename.encode(), filepath.encode(), mtime)], dtype=data.dtype)
            data.resize((data.shape[0] + 1,), axis=0)
            data[-1] = new_entry


class CubeManager(LoggerMixin, object):
    def __init__(self, filename='cubes.h5', cubes=[]):
        super(CubeManager, self).__init__()

        # Define the base directory for the data
        self.data_dir = '//apps/mitt/data'
        self.filename = filename

        


        # Combine the data directory and filename for the file path
        self.filepath = os.path.join(self.data_dir, self.filename)

        # Initialize HDF5Manager and FileModifiedCache with the correct file path
        self.db = HDF5Manager(self.filepath)
        self.cache = FileModifiedCache(self.filepath)

        # Initialize the cubes dictionary with cube name as the key
        self.cubes = {cube.__name__: cube for cube in cubes}
        self.ran_cubes = []

    def scan_directory(self, cubename):
        unprocessed_files = []
        # Compile the regex patterns for the filenames
        regexs = [re.compile(rex) for rex in self.cubes[cubename].filenames]

        # Walk through the directory to scan for files
        for root, dirs, files in os.walk(self.data_dir):  # Use the data directory here
            files = [x for x in files if not x.startswith('.')]  # Ignore hidden files

            for filename in files:
                filepath = os.path.abspath(os.path.join(root, filename))

                # Skip files that contain the cube_id in the filepath
                if f'|{self.cubes[cubename].cube_id}' in filepath:
                    continue

                # Check if the file matches any of the regex patterns
                for rex in regexs:
                    if rex.search(filepath):
                        # Check if the file is already cached (processed)
                        if self.cache.find(cubename, filepath) == -1:
                            unprocessed_files.append(filepath)
                            break

        # Return the list of unprocessed files
        return unprocessed_files

    def run_cube(self, cubename):
        """Run a specific cube processing job."""
        cube = self.cubes[cubename]

        # Skip running if the cube has already been run
        if cubename in self.ran_cubes:
            return False

        # Run required cubes first (recursive)
        for req_cube in cube.requires:
            if req_cube.__name__ not in self.ran_cubes:
                self.run_cube(req_cube.__name__)

        # Get the list of unprocessed files for the cube
        unprocessed_files = self.scan_directory(cubename)

        self.logger.info(f"Running {cubename} | Processing {len(unprocessed_files)} files")

        try:
            # Initialize the cube object
            cube_obj = cube(config)
        except KeyboardInterrupt:
            raise
        except Exception as e:
            self.logger.error(f"Exception while initializing {cubename}: {e}")
            return False

        # Process the unprocessed files
        for fpath in unprocessed_files:
            try:
                cube_obj.process(fpath)
                # Add the file to the cache after processing
                self.cache.add(cubename, fpath, utcepochnow())
            except KeyboardInterrupt:
                raise
            except Exception as e:
                self.logger.error(f"Exception while {cubename} was processing {fpath}: {e}")
                send(f"Cube Processing Error - {cubename}", f"Exception while processing {fpath}: {e}")

        # Mark the cube as processed
        self.ran_cubes.append(cubename)
        return True
