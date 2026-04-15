FROM ubuntu:22.04

# Avoid tzdata prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Install BCC tools, Python, and generic Linux headers
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-bpfcc \
    bpfcc-tools \
    linux-headers-generic \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY agent.py .
RUN chmod +x agent.py

# Run unbuffered so we see logs instantly in kubectl
CMD ["python3", "-u", "agent.py"]
