from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import DateTime
from sqlalchemy import Float
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

# Nodes Table
class Node(Base):
    __tablename__ = 'nodes'

    id = Column(Integer, primary_key=True)
    mac_address = Column(String, unique=True, nullable=False)
    row = Column(Integer, nullable=False)
    column = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default='Online')
    last_reported = Column(DateTime, default=datetime.utcnow)

    # Relationships
    data = relationship("NodeData", back_populates="node")
    issues = relationship("Alert", back_populates="node")

# Node Data Table
class NodeData(Base):
    __tablename__ = 'node_data'

    id = Column(Integer, primary_key=True)
    node_id = Column(Integer, ForeignKey('nodes.id'), nullable=False)
    vi = Column(Float, nullable=False)
    vo = Column(Float, nullable=False)
    ii = Column(Float, nullable=False)
    io = Column(Float, nullable=False)
    pi = Column(Float, nullable=False)
    po = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    node = relationship("Node", back_populates="data")

# Array Map Table
class ArrayMap(Base):
    __tablename__ = 'array_map'

    id = Column(Integer, primary_key=True)
    site_id = Column(Integer, ForeignKey('sites.id'), nullable=True)
    rows = Column(Integer, nullable=False)
    columns = Column(Integer, nullable=False)
    map_file = Column(String, nullable=True)  # Optional file path for layout

# Alerts or Issues Table
class Alert(Base):
    __tablename__ = 'alerts'

    id = Column(Integer, primary_key=True)
    node_id = Column(Integer, ForeignKey('nodes.id'), nullable=False)
    issue_type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    node = relationship("Node", back_populates="issues")

# Sites Table (Optional)
class Site(Base):
    __tablename__ = 'sites'

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)

# Database Connection
DATABASE_URL = 'postgresql://postgres:LeartPee1138?@localhost/ss'  # Update with your credentials
engine = create_engine(DATABASE_URL, echo=True)
Base.metadata.create_all(engine)

# Session Setup
Session = sessionmaker(bind=engine)
session = Session()

# Example Usage
# Adding a new node
new_node = Node(mac_address='00:1A:2B:3C:4D:5E', row=1, column=1, status='Online')
session.add(new_node)
session.commit()

print("Tables created and example node added.")
