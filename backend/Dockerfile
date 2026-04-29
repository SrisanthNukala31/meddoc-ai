FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Removed apt-get install since opencv-python-headless doesn't require GUI libraries

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files (including .pt model files)
COPY . .

# Expose the default port for Hugging Face Spaces
EXPOSE 7860

# Run the FastAPI server on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
