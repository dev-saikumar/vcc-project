#!/bin/bash

if [ ! -f "package.json" ]; then
    echo "package.json missing"
    exit 1
fi

if [ ! -f "ignore.txt" ]; then
    echo "ignore.txt file missing"
    exit 1
fi

current_directory="$PWD"

compressed_file="compressed.tar.gz"

# Navigate to the parent directory
cd "$(dirname "$current_directory")"

# Compress the current directory with a depth of 1 and exclude files/directories listed in ignore.txt
tar -czf "$compressed_file" --exclude-from="$current_directory/ignore.txt" --directory="$current_directory" .

url="192.168.49.2:31863/deploy"
# url="localhost:8080/deploy"


curl_output=$(curl -X POST -F "code-compressed=@$compressed_file" "$url")
echo "$curl_output"
rm "$compressed_file"

# Navigate back to the original directory
cd "$current_directory"

# Clean up: remove the compressed file