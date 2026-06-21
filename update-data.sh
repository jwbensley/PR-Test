#!/bin/bash

# Check if gform.csv exists
if [ -f gform.csv ]; then
    # Append contents of gform.csv to data.csv
    cat gform.csv >> data.csv
    
    # Sort data.csv by the second column and overwrite it,
    # but don't include the first row (headers)
    (head -n 1 data.csv && tail -n +2 data.csv | sort -t, -g -k2,2) > data_sorted.csv
    mv data_sorted.csv data.csv

    # Remove gform.csv
    rm gform.csv
else
    echo "gform.csv not found. No data to append."
fi
