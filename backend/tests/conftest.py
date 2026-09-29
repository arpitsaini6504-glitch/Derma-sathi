import pytest
import io
import numpy as np
import cv2
from PIL import Image
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db

# Use in-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def clear_synthetic_image_bytes():
    """Generates an in-memory sharp test image."""
    arr = np.zeros((300, 300, 3), dtype=np.uint8)
    # Add high frequency edges so Laplacian variance is high
    for i in range(0, 300, 10):
        cv2.line(arr, (i, 0), (i, 300), (255, 255, 255), 2)
        cv2.line(arr, (0, i), (300, i), (180, 120, 70), 2)
    _, buffer = cv2.imencode('.jpg', arr)
    return buffer.tobytes()

@pytest.fixture
def dark_image_bytes():
    """Generates an excessively dark test image."""
    arr = np.full((300, 300, 3), 10, dtype=np.uint8)
    _, buffer = cv2.imencode('.jpg', arr)
    return buffer.tobytes()

@pytest.fixture
def blurry_image_bytes():
    """Generates a blurred test image."""
    arr = np.full((300, 300, 3), 128, dtype=np.uint8)
    # Very flat image has virtually 0 Laplacian variance
    _, buffer = cv2.imencode('.jpg', arr)
    return buffer.tobytes()
