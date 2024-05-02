#!/bin/bash


# if [ ! -f "package.json" ];
# then
#     echo "package.json missing"
#     exit 1
# fi

# if [ ! -f ignore.txt ];
# then
#     echo "ignore.txt missing"
# fi


current_directory="$PWD"

compressed_file="compressed.tar.gz"

tar -czf "$compressed_file" "$current_directory/$current_directory" --directory="$current_directory"

url="localhost:9001/deploy"

curl_output=$(curl -X POST -F "code-compressed=@$compressed_file" "$url")
echo "$curl_output"
rm "$compressed_file"

