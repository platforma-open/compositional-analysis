import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Hide TensorFlow INFO and WARNING messages

import warnings
warnings.filterwarnings('ignore', category=UserWarning)  # Ignore general harmless warnings like from anndata

import pandas as pd
import numpy as np
import anndata as ad
import os
import argparse
import sccoda.util.comp_ana as comp_ana


def calculate_fold_changes(count_table, groups, baseline_group):
    fold_changes = []
    pseudocount = 0.5  # Avoid division by zero
    for group in groups:
        if group == baseline_group:
            continue
        for cell_type in count_table.columns:
            # Fix: Use simple index instead of get_level_values for grouped data
            baseline_mean = count_table.loc[count_table.index == baseline_group, cell_type].mean()
            group_mean = count_table.loc[count_table.index == group, cell_type].mean()
            log2_fc = np.log2((group_mean + pseudocount) / (baseline_mean + pseudocount))
            fold_changes.append({
                "group": group,
                "cell_type": cell_type,
                "log2_fold_change": log2_fc,
                "q_value": np.nan,
                "credible": False
            })
    return fold_changes

def main():
    parser = argparse.ArgumentParser(description="Run scCODA or fallback to simple fold change calculation.")
    parser.add_argument("--metadata_csv", required=True, help="Path to metadata CSV file.")
    parser.add_argument("--cell_annotation_csv", required=True, help="Path to cell annotation CSV file.")
    parser.add_argument("--cell_type_column", required=True, help="Name of column with cell type labels.")
    parser.add_argument("--contrast_column", required=True, help="Name of metadata column to contrast (e.g., timepoint).")
    parser.add_argument("--output_dir", required=True, help="Directory to save results.")
    parser.add_argument("--baseline_level", required=True, help="Baseline level for the contrast column.")
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    print("\nLoading input data...")
    metadata = pd.read_csv(args.metadata_csv)
    clusters = pd.read_csv(args.cell_annotation_csv)

    merged = pd.merge(clusters, metadata, on="Sample")
    print(f"✅ Merged {merged.shape[0]} cells across {merged['Sample'].nunique()} samples.\n")

    print("Summarizing counts per sample...\n")
    count_table = merged.groupby(["Sample", args.cell_type_column]).size().unstack(fill_value=0)
    print(count_table)

    # Create AnnData
    adata = ad.AnnData(count_table)
    adata.obs = metadata.set_index("Sample").loc[count_table.index]

    print(f"\nSetting baseline level for modeling: {args.baseline_level}\n")

    # Check number of replicates
    sample_counts = metadata[args.contrast_column].value_counts()
    enough_replicates = all(sample_counts >= 2)

    result_rows = []

    if enough_replicates:
        print("Running scCODA compositional analysis...\n")
        formula = f'C({args.contrast_column}, Treatment(reference="{args.baseline_level}"))'
        ca = comp_ana.CompositionalAnalysis(adata, formula=formula)
        results = ca.sample_hmc()
        eff_df = results.effect_df
        
        # Store references for manual fold change calculation if needed
        contrast_var = args.contrast_column
        baseline = args.baseline_level

        for idx, row in eff_df.iterrows():
            group, cell_type = idx
            log2fc = row["log2-fold change"]
            inclusion_prob = row.get("Inclusion probability", np.nan)
            # Consider significant if inclusion probability > 0.95 (95% credible)
            credible = inclusion_prob > 0.95 if not np.isnan(inclusion_prob) else False
            
            # BUG FIX: If scCODA's log2-fold change is 0, calculate manually
            if log2fc == 0.0:
                
                # Get the test group name from the formula result
                test_group = None
                if "Test" in str(group):
                    test_groups = metadata[metadata[contrast_var] != baseline][contrast_var].unique()
                    if len(test_groups) == 1:
                        test_group = test_groups[0]
                
                if test_group:
                    # Calculate manual fold change
                    control_samples = metadata[metadata[contrast_var] == baseline]['Sample'].tolist()
                    test_samples = metadata[metadata[contrast_var] == test_group]['Sample'].tolist()
                    
                    # Get counts for this cell type (convert to int if needed)
                    cell_type_col = int(cell_type) if str(cell_type).isdigit() else cell_type
                    control_total = count_table.loc[control_samples, cell_type_col].sum()
                    control_cells = count_table.loc[control_samples].sum().sum()
                    test_total = count_table.loc[test_samples, cell_type_col].sum()
                    test_cells = count_table.loc[test_samples].sum().sum()
                    
                    # Calculate proportions and log2 fold change
                    control_prop = control_total / control_cells
                    test_prop = test_total / test_cells
                    pseudocount = 0.5
                    log2fc = np.log2((test_prop + pseudocount/test_cells) / (control_prop + pseudocount/control_cells))
            
            result_rows.append({
                "group": group,
                "cell_type": cell_type,
                "log2_fold_change": log2fc,
                "q_value": inclusion_prob,  # Use inclusion probability as scCODA's significance measure
                "credible": credible
            })

    else:
        print("⚠️ Not enough replicates per group, skipping scCODA and calculating log2 fold changes manually.\n")
        count_table_with_group = count_table.copy()
        count_table_with_group[args.contrast_column] = metadata.set_index("Sample").loc[count_table.index][args.contrast_column]

        count_table_grouped = count_table_with_group.groupby(args.contrast_column).sum()

        groups = count_table_grouped.index.tolist()
        fold_changes = calculate_fold_changes(count_table_grouped, groups, baseline_group=args.baseline_level)

        for fc in fold_changes:
            result_rows.append(fc)

    # Save results
    results_df = pd.DataFrame(result_rows)
    results_df.to_csv(os.path.join(args.output_dir, "sccoda_results_summary.csv"), index=False)
    print(f"✅ Saved scCODA results to {os.path.join(args.output_dir, 'sccoda_results_summary.csv')}")

    # Save relative counts for barplots
    rel_counts = (
        merged.groupby(["Sample", args.cell_type_column])
        .size()
        .unstack(fill_value=0)
    )

    rel_counts = rel_counts.div(rel_counts.sum(axis=1), axis=0) * 100

    rel_counts_melted = rel_counts.reset_index().melt(id_vars="Sample", var_name="Cluster", value_name="Relative abundance")
    rel_counts_melted.to_csv(os.path.join(args.output_dir, "relative_counts_for_barplot.csv"), index=False)
    print(f"✅ Saved relative counts for barplot to {os.path.join(args.output_dir, 'relative_counts_for_barplot.csv')}")

    # Save absolute counts for boxplots
    abs_counts = (
        merged.groupby(["Sample", args.cell_type_column])
        .size()
        .reset_index(name="Abundance")
        .rename(columns={args.cell_type_column: "Cluster"})
    )
    abs_counts.to_csv(os.path.join(args.output_dir, "counts_for_boxplot.csv"), index=False)
    print(f"✅ Saved counts for boxplot to {os.path.join(args.output_dir, 'counts_for_boxplot.csv')}")


if __name__ == "__main__":
    main()
