#!/usr/bin/env python3

import pandas as pd
import argparse
import os
import json


def main():
    parser = argparse.ArgumentParser(description="Evaluate whether scCODA or fold change analysis will be used.")
    parser.add_argument("--metadata_csv", required=True, help="Path to metadata CSV file.")
    parser.add_argument("--contrast_column", required=True, help="Name of metadata column to contrast (e.g., timepoint).")
    parser.add_argument("--output_file", required=True, help="Path to output txt file.")
    args = parser.parse_args()

    # Load metadata
    metadata = pd.read_csv(args.metadata_csv)
    
    # Check number of replicates per group
    sample_counts = metadata[args.contrast_column].value_counts()
    enough_replicates = all(sample_counts >= 2)
    
    # Determine analysis method
    if enough_replicates:
        analysis_method = "sccoda"
    else:
        analysis_method = "foldChange"
    
    # Write result to output file as proper JSON
    output_dir = os.path.dirname(args.output_file)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    with open(args.output_file, 'w') as f:
        json.dump(analysis_method, f)
    
    print(f"Analysis method: {analysis_method}")
    print(f"Result written to: {args.output_file}")


if __name__ == "__main__":
    main() 