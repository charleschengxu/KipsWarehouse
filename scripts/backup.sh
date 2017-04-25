#!/bin/bash

# Based on https://gist.github.com/2206527

# Basic variables
mysqlpass=REPLACE_WITH_MYSQL_PASSWORD
bucket=REPLACE_WITH_S3_BUCKET

# Timestamp (sortable AND readable)
stamp=`date +"%s - %A %d %B %Y @ %H%M"`

# List all the databases
databases=`mysql -u root -p$mysqlpass -e "SHOW DATABASES;" | tr -d "| " | grep -v "\(Database\|information_schema\|performance_schema\|mysql\|test\)"`

# Loop the databases
for db in $databases; do

  # Define our filenames
  filename="$stamp - $db.sql.gz"
  tmpfile="/tmp/$filename"
  object="$bucket/$filename"

  # Dump and zip
  echo -e "  creating \e[0;35m$tmpfile\e[00m"
  mysqldump -u root -p$mysqlpass --force --opt --databases "$db" | gzip -c > "$tmpfile"

  # Upload
  echo -e "  uploading..."
  s3cmd put "$tmpfile" "$object"

  # Delete
  rm -f "$tmpfile"

done;

curl -s --user "REPLACE_WITH_API_KEY" \
    REPLACE_WITH_URL \
    -F from="FROM EMAIL" \
    -F to="TO_EMAIL" \
    -F subject="SUBJECT" \
    -F text="BODY"
