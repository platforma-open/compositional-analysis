# Overview

This block analyzes changes in cell type proportions across experimental conditions. If replicates are too few, it calculates fold changes and generates exploratory visualizations. When replicates are sufficient, it uses scCODA to perform a Bayesian compositional analysis, identifying statistically credible shifts in cell populations.