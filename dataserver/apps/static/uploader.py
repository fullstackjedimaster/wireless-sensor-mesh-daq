import argparse
import glob
import gzip
import os
import subprocess
import sys
import tempfile

import boto
from boto.s3.key import Key

AWS_ACCESS_KEY_ID = 'AKIAISSH7MN433CHQLAA'
AWS_SECRET_ACCESS_KEY = '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'
S3_BUCKET = 'static.intelligentarray.com'
#S3_BUCKET = 'lester-test'
BUILD_RELATIVE_PATH = '_build'



def upload_file_to_bucket(filename, bucket, subfolder='', overwrite=False, gz=False):
    """
    Uploads a file to a bucket in S3.

    Args:
        filename: The file to upload.
        bucket_name: The bucket where the file is uploaded.
        subfolder: A subfolder in the bucket to upload the file.
        overwrite: True to overwrite existing data.
        metadata: A dictionary of metadata definitions.

    Returns:
        True if successful, False otherwise.
    """
    if not os.path.exists(filename):
        print('File does not exist: %s' % filename)
        return False

    # Generate full path for S3
    path = os.path.join(subfolder, os.path.basename(filename))

    # Set key and check to see if file exists
    key = Key(bucket)
    key.key = path
    if key.exists() and not overwrite:
        print('File already exists: %s' % path)
        return False

    # Compress the file, if requested
    tmp_filename = None
    if gz:
        # Open the file to read its contents.
        f = open(filename, 'r')

        # Generate a temp file and open it for writing
        os_handle, tmp_filename = tempfile.mkstemp()
        g = open(tmp_filename, 'wb')

        # Create a GzipFile object to gzip data and send it to the temp file
        gzf = gzip.GzipFile(os.path.basename(filename), 'wb', fileobj=g)

        # Compress and write the file
        gzf.writelines(f)  # Compress the data to the temp file

        # Cleanup
        gzf.close()
        g.close()
        f.close()

        # Set metadata Content-Encoding and Content-Type
        metadata = {'Content-Encoding': 'gzip'}
        if os.path.basename(filename)[-4:].lower() == '.css':
            metadata.update({'Content-Type': 'text/css'})
        elif os.path.basename(filename)[-3:].lower() == '.js':
            metadata.update({'Content-Type': 'application/x-javascript'})
        key.update_metadata(metadata)

        file_to_upload = tmp_filename
    else:
        file_to_upload = filename

    # Upload the file
    try:
        key.set_contents_from_filename(file_to_upload, policy='public-read')
    except:
        print('Unable to upload file: %s' % filename)

    # Delete temp file if one was created
    if tmp_filename is not None:
        assert(os.path.exists(tmp_filename))
        os.remove(tmp_filename)

    return True


def upload_folder_to_bucket(folder, bucket_name, subfolder='', overwrite=False, gz=False):
    """
    Uploads a folder structure and its contents to S3.

    There are some hard-coded overrides here. For files under the static and
    style folders, the content-encoding is set to 'gzip'.

    Args:
        folder: The folder whose contacts to upload.
        bucket_name: The bucket to upload to.
        subfolder: A subfolder to upload into.
        overwrite: True to overwrite current contents.

    Returns:
        True if success, False otherwise.
    """
    if not os.path.exists(folder):
        print('Folder does not exist: %s' % folder)
        return False

    # Get S3 connection and bucket
    try:
        s3 = boto.connect_s3(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
    except:
        print('Could not connect to S3.')
        return False

    try:
        bucket = s3.get_bucket(bucket_name)
    except:
        print('Could not get bucket: %s' % bucket_name)
        return False

    # Walk folder structure, uploading each file encountered
    for root, dirs, files in os.walk(folder):
        for f in files:
            log = ''
            filename = os.path.join(root, f)
            # Remove root and leading slash
            dest_folder = os.path.join(subfolder, root[len(folder)+1:])
            log = '%s --> %s' % (f, dest_folder)

            # Make sure any JS or CSS files are encoded.
            if f[-4:].lower() == '.css' or f[-3:].lower() == '.js':
                key = upload_file_to_bucket(filename, bucket, dest_folder, overwrite=overwrite,
                                            gz=gzip)
            else:
                key = upload_file_to_bucket(filename, bucket, dest_folder, overwrite=overwrite)

            print(log)

    return True


if __name__ == '__main__':
    p = argparse.ArgumentParser(description='Compile and upload static resources to S3.')
    p.add_argument('--ant', '-a', action='store_true',
                   help='Run ant on current directory before upload.')
    p.add_argument('--gzip', '-g', action='store_true',
                   help='Gzip .css and .js files before uploading.')
    p.add_argument('--version', '-v', help='Version number of assets.')
    p.add_argument('--stage', '-s', action='store_true',
                   help='Upload to stage folder. Version ignored.')
    p.add_argument('--overwrite', '-o', action='store_true',
                   help='Overwrite existing files.')
    args = p.parse_args()

    # Requires at least a version number or stage to upload
    if not args.version and not args.stage:
         p.print_help()
         sys.exit(0)

    # Run ant and verify success. Requires ant in the user's path.
    if args.ant:
        returncode = subprocess.call(['ant'], shell=True)
        if returncode != 0:
            print('Error running ant! Exiting...')
            sys.exit(1)

    # Stage gets priority if version is also specified
    if args.stage:
        print('uploader: Uploading to STAGE.')
        upload_folder_to_bucket('_build', S3_BUCKET, 'stage', overwrite=args.overwrite,
                                gz=args.gzip)
    else:
        print('uploader: Uploading to prod/%s' % args.version)
        upload_folder_to_bucket('_build', S3_BUCKET, 'prod/'+args.version,
                                overwrite=args.overwrite, gz=args.gzip)
