# Overview

Analyzes changes in cell type or cluster proportions across experimental conditions to identify shifts in cellular composition. The block automatically selects the appropriate analysis method based on replicate availability: when sufficient replicates are present (at least two per condition), it uses scCODA for Bayesian compositional analysis that accounts for the fact that proportions are constrained to sum to 100% within each sample, using Bayesian inference to identify statistically credible changes (q-value > 0.95). When replicates are insufficient, it calculates log2 fold changes in cell proportions relative to a baseline condition for exploratory analysis without statistical testing.

The block requires cell type or cluster annotations (from Leiden Clustering or Cell Type Annotation blocks) and sample metadata specifying experimental conditions. Results include log2 fold changes in cell proportions, relative log2 fold changes (for scCODA), and q-values indicating statistical credibility.

The block uses scCODA v0.1.9 for Bayesian compositional analysis. When using this block in your research, cite the scCODA publication (Büttner et al. 2021) listed below.

The following publication describes the methodology used:

> Büttner, M., Ostner, J., Müller, C. L., Theis, F. J., & Schubert, B. (2021). scCODA is a Bayesian model for compositional single-cell data analysis. _Nature Communications_ **12**, 6876 (2021). [https://doi.org/10.1038/s41467-021-27150-6](https://doi.org/10.1038/s41467-021-27150-6)