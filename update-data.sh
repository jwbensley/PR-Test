#!/bin/bash

# Check if gform.csv exists
if [ -f gform.csv ]; then
    # Append contents of gform.csv to data.csv
    cat gform.csv >> data.csv
    
    # Sort data.csv by the first column and overwrite it
    sort -t, -k1,1 data.csv -o data.csv
    
    # Remove gform.csv
    rm gform.csv
else
    echo "gform.csv not found. No data to append."
fi
