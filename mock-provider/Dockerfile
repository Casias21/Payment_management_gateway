# Use an official Python runtime as a parent image
FROM python:3.9-slim-buster

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install Flask

# Expose the port the app runs on
EXPOSE 5000

# Run the application
CMD ["python", "mock_provider.py"]
