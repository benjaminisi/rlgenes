export const sl202605html = `
<html>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gene and SNP Reference Data</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        h2 {
            color: #2c3e50;
            border-bottom: 2px solid #eee;
            padding-bottom: 5px;
            margin-top: 40px;
        }
        h3 {
            color: #34495e;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 15px;
        }
        ul {
            margin-top: 0;
            margin-bottom: 15px;
        }
        li {
            margin-bottom: 5px;
        }
        .snp-info {
            background-color: #f9f9f9;
            padding: 15px;
            border-left: 4px solid #3498db;
            margin-bottom: 20px;
        }
        .snp-info p {
            margin: 5px 0;
        }
        hr {
            border: 0;
            height: 1px;
            background: #ccc;
            margin: 40px 0;
        }
    </style>
</head>
<body>

    <!-- TXNRD1 Section -->
    <h2>TXNRD1 (Thioredoxin Reductase 1)</h2>
    <p>TXNRD1 encodes TrxR1, the cytosolic selenoenzyme that recycles thioredoxin-1 (Trx1) from its oxidised to reduced form using NADPH and FAD. Trx1 is the electron donor for peroxiredoxins (Prx1/2) responsible for cytosolic H2O2 clearance, for ribonucleotide reductase (RNR) in DNA synthesis, for Ref-1/APE1 in DNA base excision repair, and for maintaining the reduced intracellular environment that governs NF-kB and AP-1 redox signalling. When TrxR1 is insufficient, Trx1 accumulates in its oxidised form, peroxiredoxins hyperoxidise, the glutathione/GPx system must compensate, and the threshold for DNA damage, inflammatory amplification, and apoptosis is lowered. TrxR1 expression is primarily driven by Nrf2 and is strongly upregulated in response to electrophilic stress, oxidative challenge, heat, and heavy metal exposure.</p>

    <div class="snp-info">
        <p><strong>SNP:</strong> rs7310505 &nbsp;&nbsp; <strong>Change:</strong> C &gt; T &nbsp;&nbsp; <strong>Risk allele:</strong> T &nbsp; (3' UTR variant)</p>
        <p><strong>C allele</strong> = normal TrxR1 translational output</p>
        <p><strong>T allele</strong> = reduced TrxR1 protein yield</p>
    </div>

    <h3>Functional Effect</h3>
    <ul>
        <li><strong>T/T:</strong> greatest reduction in TrxR1 protein output — the 3' UTR tag that controls mRNA stability and translational efficiency is disrupted; the message is broken down faster or read less efficiently, so less enzyme is produced even when gene activation is normal</li>
        <li><strong>C/T:</strong> intermediate reduction in TrxR1 output</li>
        <li><strong>C/C:</strong> normal TrxR1 translational output</li>
    </ul>

    <h3>Normal TrxR1 State</h3>
    <p>Nrf2 activation &rarr; robust TrxR1 expression &rarr; Trx1 recycled efficiently &rarr; Prx1/2 active &rarr; cytosolic H2O2 cleared &rarr; RNR and Ref-1 supported &rarr; DNA synthesis and repair intact &rarr; NF-kB redox regulation maintained.</p>

    <h3>Impaired TrxR1 State (T/T)</h3>
    <p>Reduced TrxR1 output &rarr; Trx1 accumulates oxidised &rarr; Prx hyperoxidation accumulates &rarr; glutathione/GPx system recruited as backup &rarr; RNR and Ref-1 function impaired &rarr; DNA damage accumulates &rarr; NF-kB inflammatory threshold lowered &rarr; oxidative stress amplified.</p>

    <h3>Pathways</h3>
    <ul>
        <li>Nrf2/ARE antioxidant response pathway</li>
        <li>Thioredoxin/peroxiredoxin H2O2 clearance system</li>
        <li>Ribonucleotide reductase (RNR) — DNA synthesis</li>
        <li>Ref-1/APE1 — DNA base excision repair</li>
        <li>NF-kB and AP-1 redox-sensitive transcription factor regulation</li>
        <li>Glutathione/GPx backup system</li>
    </ul>

    <h3>Nutrients &amp; Cofactors</h3>
    <ul>
        <li><strong>Selenium</strong> — obligate TrxR1 active site (selenocysteine)</li>
        <li><strong>Riboflavin (B2/FAD)</strong> — TrxR1 electron transfer prosthetic group</li>
        <li><strong>NADPH</strong> — electron donor for TrxR1 catalysis</li>
        <li><strong>Vitamin C</strong> — Trx1 recycling backup when TrxR1 is selenium-limited</li>
        <li><strong>Glutathione (GSH)</strong> — backup peroxide clearance system</li>
        <li><strong>Magnesium</strong> — ATP-dependent Prx hyperoxidation repair via sulfiredoxin</li>
        <li><strong>Zinc</strong> — Nrf2 transcriptional machinery and Ref-1/APE1 redox support</li>
        <li><strong>Vitamin B6 (P5P)</strong> — transsulfuration pathway; cysteine supply for glutathione synthesis</li>
    </ul>

    <h3>Hindered By</h3>
    <ul>
        <li>Low selenium status</li>
        <li>Riboflavin deficiency</li>
        <li>G6PD deficiency (impairs NADPH regeneration)</li>
        <li>Heavy metal exposure (gold, arsenic, mercury, platinum — direct selenocysteine alkylation)</li>
        <li>Chronic inflammation suppressing SELENOP delivery</li>
        <li>Glucocorticoid excess (suppresses Nrf2-driven TXNRD1 transcription)</li>
        <li>High oxidative burden exceeding TrxR1 recycling capacity</li>
    </ul>

    <hr>

    <!-- TXNRD2 Section -->
    <h2>TXNRD2 (Thioredoxin Reductase 2)</h2>
    <p>TXNRD2 encodes TrxR2, the mitochondria-specific selenoenzyme that recycles thioredoxin-2 (Trx2) within the mitochondrial matrix. Trx2 is the electron donor for the mitochondrial peroxiredoxins Prx3 and Prx5, which are responsible for clearing mitochondrial H2O2 generated as a byproduct of oxidative phosphorylation. TrxR2 also regulates the mitochondrial permeability transition pore (mPTP) — the apoptosis gateway — and supports the mitochondrial redox environment in which TFAM (mitochondrial transcription factor A) and the steroidogenic enzyme complexes operate. Expression is driven primarily by PGC-1alpha via AMPK and Nrf2 signalling.</p>

    <div class="snp-info">
        <p><strong>SNP:</strong> rs1548357 &nbsp;&nbsp; <strong>Change:</strong> C &gt; T &nbsp;&nbsp; <strong>Risk allele:</strong> T &nbsp; (intronic variant)</p>
        <p><strong>C allele</strong> = normal basal TrxR2 expression</p>
        <p><strong>T allele</strong> = reduced TXNRD2 promoter/regulatory activity</p>
    </div>

    <h3>Functional Effect</h3>
    <ul>
        <li><strong>T/T:</strong> greatest reduction in baseline TrxR2 expression — intronic regulatory region affected; mechanism involves disruption of splice site or enhancer sequences reducing gene output; mitochondrial redox status is altered</li>
        <li><strong>C/T:</strong> intermediate reduction</li>
        <li><strong>C/C:</strong> normal TXNRD2 expression</li>
    </ul>

    <h3>Normal TrxR2 State</h3>
    <p>PGC-1alpha/Nrf2 activation &rarr; robust TrxR2 expression &rarr; Trx2 recycled &rarr; Prx3/Prx5 active &rarr; mitochondrial H2O2 cleared &rarr; mPTP stabilised &rarr; apoptosis threshold maintained &rarr; ETC and steroidogenic enzyme function intact.</p>

    <h3>Impaired TrxR2 State (T/T)</h3>
    <p>Reduced TrxR2 &rarr; Trx2 accumulates oxidised &rarr; Prx3/Prx5 hyperoxidise &rarr; mitochondrial H2O2 accumulates &rarr; cardiolipin oxidation &rarr; ETC dysfunction &rarr; mPTP sensitised &rarr; ASK1 released &rarr; apoptosis threshold lowered &rarr; mitochondrial biogenesis impaired.</p>

    <h3>Pathways</h3>
    <ul>
        <li>PGC-1alpha mitochondrial biogenesis axis</li>
        <li>Mitochondrial thioredoxin/peroxiredoxin H2O2 clearance</li>
        <li>mPTP regulation and apoptosis threshold</li>
        <li>Mitochondrial steroidogenesis (adrenal, gonadal)</li>
        <li>AMPK-PGC-1alpha-TXNRD2 transcriptional axis</li>
    </ul>

    <h3>Nutrients &amp; Cofactors</h3>
    <ul>
        <li><strong>Selenium</strong> — TrxR2 selenocysteine active site</li>
        <li><strong>Riboflavin (B2/FAD)</strong> — TrxR2 electron transfer</li>
        <li><strong>NADPH</strong> — via NNT (nicotinamide nucleotide transhydrogenase) in mitochondrial matrix</li>
        <li><strong>CoQ10/ubiquinol</strong> — cardiolipin and inner mitochondrial membrane protection</li>
        <li><strong>Magnesium</strong> — mPTP stabilisation and ATP for Prx repair</li>
        <li><strong>Alpha-lipoic acid</strong> — mitochondrial dithiol antioxidant and Trx system support</li>
        <li><strong>B3/NAD+/NMN/NR</strong> — TCA flux, IDH2/NNT support, mitochondrial NADH/NAD+ ratio</li>
    </ul>

    <h3>Hindered By</h3>
    <ul>
        <li>Low selenium status</li>
        <li>ETC dysfunction (Complex I/III inhibition increases mitochondrial ROS load)</li>
        <li>Heavy metals (mercury, cadmium — mitochondrial accumulation)</li>
        <li>High calcium load (mPTP sensitisation)</li>
        <li>Chronic inflammation</li>
        <li>Glucocorticoid excess</li>
        <li>Aging (progressive mitochondrial NAD+ depletion)</li>
        <li>Alcohol (mitochondrial uncoupling)</li>
    </ul>

    <hr>

    <!-- TXN2 Section -->
    <h2>TXN2 (Mitochondrial Thioredoxin 2)</h2>
    <p>TXN2 encodes Trx2, the small redox protein inside the mitochondrial matrix that is the direct substrate of TrxR2. Trx2 has two functions: it donates electrons to Prx3 and Prx5 for mitochondrial H2O2 clearance, and it holds ASK1 (apoptosis signal-regulating kinase 1) in an inactive state by maintaining a disulfide bond. When oxidative stress consumes Trx2, ASK1 is released and initiates the mitochondrial apoptosis cascade via MKK3/6-p38 and MKK4/7-JNK, with downstream cytochrome c release and caspase activation. The T/T genotype at rs4485648 reduces Trx2 availability, lowering the threshold at which cells in high-energy-demand tissues (neurons, cardiomyocytes, beta cells, adrenocortical cells) initiate irreversible apoptotic cell death.</p>

    <div class="snp-info">
        <p><strong>SNP:</strong> rs4485648 &nbsp;&nbsp; <strong>Change:</strong> C &gt; T &nbsp;&nbsp; <strong>Risk allele:</strong> T &nbsp; (intronic/regulatory variant)</p>
        <p><strong>C allele</strong> = normal Trx2 expression</p>
        <p><strong>T allele</strong> = reduced Trx2 mitochondrial availability</p>
    </div>

    <h3>Functional Effect</h3>
    <ul>
        <li><strong>T/T:</strong> greatest reduction in Trx2 expression or functional efficiency — lowers the oxidative threshold at which ASK1 is released and mitochondrial apoptosis is initiated; most clinically apparent under conditions of mitochondrial oxidative stress</li>
        <li><strong>C/T:</strong> intermediate reduction</li>
        <li><strong>C/C:</strong> normal TXN2 expression</li>
    </ul>

    <h3>Normal Trx2 State</h3>
    <p>Trx2 reduced &rarr; ASK1 held inactive &rarr; mitochondrial apoptosis suppressed &rarr; Prx3/Prx5 supported &rarr; H2O2 cleared &rarr; cardiomyocytes, neurons, beta cells, adrenocortical cells protected.</p>

    <h3>Impaired Trx2 State (T/T)</h3>
    <p>Reduced Trx2 &rarr; ASK1 released under lower oxidative threshold &rarr; MKK/JNK/p38 cascade &rarr; cytochrome c release &rarr; caspase activation &rarr; irreversible apoptosis in energy-demanding post-mitotic cells — neurons, cardiomyocytes, pancreatic beta cells.</p>

    <h3>Pathways</h3>
    <ul>
        <li>ASK1-MKK-JNK/p38 apoptosis signalling</li>
        <li>Mitochondrial thioredoxin/peroxiredoxin H2O2 clearance (shared with TXNRD2)</li>
        <li>mPTP/cytochrome c mitochondrial apoptosis pathway</li>
        <li>PGC-1alpha mitochondrial biogenesis axis</li>
        <li>SIRT3 mitochondrial protein deacetylation</li>
    </ul>

    <h3>Nutrients &amp; Cofactors</h3>
    <ul>
        <li><strong>Selenium</strong> — TrxR2 selenocysteine (obligate Trx2 recycler)</li>
        <li><strong>Riboflavin (B2/FAD)</strong> — TrxR2 cofactor (Trx2 recycler)</li>
        <li><strong>CoQ10/ubiquinol</strong> — mitochondrial membrane antioxidant complementing Prx3</li>
        <li><strong>Alpha-lipoic acid</strong> — direct Trx2 backup reduction and ASK1 modulation</li>
        <li><strong>Magnesium</strong> — mPTP stabilisation and ATP for Prx repair</li>
        <li><strong>Vitamin E (tocotrienols)</strong> — cardiolipin and membrane lipid peroxide protection</li>
        <li><strong>Iron</strong> — monitoring only; elevated ferritin or transferrin saturation amplifies Fenton chemistry and mitochondrial ROS in T/T; check before recommending iron-containing supplements</li>
    </ul>

    <h3>Hindered By</h3>
    <ul>
        <li>Low selenium status</li>
        <li>Riboflavin deficiency</li>
        <li>Mitochondrial calcium overload</li>
        <li>High mitochondrial ROS (ETC dysfunction, heavy metals)</li>
        <li>Mitophagy impairment (accumulation of Trx2-depleted mitochondria)</li>
        <li>Aging</li>
        <li>Alcohol (depletes mitochondrial glutathione)</li>
    </ul>

    <hr>

    <!-- PRKAA2 Section -->
    <h2>PRKAA2 (AMP-Activated Protein Kinase Alpha-2 Subunit)</h2>
    <p>PRKAA2 encodes the alpha-2 catalytic subunit of AMPK, the master energy-sensing kinase activated by rising AMP:ATP ratios (energy deficit), calcium via CAMKK2 (exercise), and upstream kinase LKB1. When activated, AMPK switches the cell from anabolic (building, storing) to catabolic (burning, clearing) mode: it inhibits cholesterol and fatty acid synthesis, activates glucose uptake and fatty acid oxidation, drives mitochondrial biogenesis via PGC-1alpha, activates Nrf2 antioxidant gene expression (including TXNRD1 and TXNRD2), and triggers autophagy and mitophagy. The alpha-2 isoform is the dominant catalytic subunit in skeletal muscle, heart, and hypothalamus. Variants in PRKAA2 are associated with type 2 diabetes susceptibility, metabolic syndrome, and blunted exercise adaptation.</p>

    <div class="snp-info">
        <p><strong>SNP:</strong> rs2796498 &nbsp;&nbsp; <strong>Change:</strong> G &gt; A &nbsp;&nbsp; <strong>Risk allele:</strong> A &nbsp; (coding variant)</p>
        <p><strong>G allele</strong> = normal AMPK-alpha2 catalytic efficiency</p>
        <p><strong>A allele</strong> = reduced AMPK catalytic output under metabolic challenge</p>
    </div>

    <h3>Functional Effect</h3>
    <ul>
        <li><strong>A/A:</strong> greatest reduction in AMPK-alpha2 catalytic efficiency — associated with type 2 diabetes susceptibility and diabetic nephropathy risk in multiple population studies; precise structural mechanism not fully characterised in published literature but consistent with blunted AMPK response under metabolic and oxidative challenge</li>
        <li><strong>G/A:</strong> intermediate</li>
        <li><strong>G/G:</strong> normal AMPK-alpha2 function</li>
    </ul>

    <div class="snp-info">
        <p><strong>SNP:</strong> rs10789038 &nbsp;&nbsp; <strong>Change:</strong> C &gt; T &nbsp;&nbsp; <strong>Risk allele:</strong> T &nbsp; (promoter variant)</p>
        <p><strong>C allele</strong> = normal PRKAA2 basal transcription</p>
        <p><strong>T allele</strong> = reduced AMPK-alpha2 protein pool</p>
    </div>

    <h3>Functional Effect</h3>
    <ul>
        <li><strong>T/T:</strong> greatest reduction in baseline PRKAA2 transcription — promoter variant reduces mRNA output, shrinking the available AMPK-alpha2 protein pool for heterotrimeric assembly; less total AMPK capacity regardless of activation signal strength</li>
        <li><strong>C/T:</strong> intermediate</li>
        <li><strong>C/C:</strong> normal baseline expression</li>
        <li><em>Note: rs2796498 (reduced catalytic efficiency) + rs10789038 (reduced protein pool) together produce additive AMPK impairment</em></li>
    </ul>

    <h3>Normal AMPK State</h3>
    <p>Energy deficit or exercise &rarr; AMP:ATP rises or calcium released &rarr; LKB1/CAMKK2 activate AMPK &rarr; fatty acid oxidation, glucose uptake, mitochondrial biogenesis, Nrf2 activation, autophagy/mitophagy &rarr; metabolic flexibility and cellular maintenance restored.</p>

    <h3>Impaired AMPK State (A/A + T/T)</h3>
    <p>Blunted AMPK response &rarr; mTORC1 remains active &rarr; anabolic mode persists &rarr; fat and cholesterol accumulate &rarr; mitochondrial biogenesis impaired &rarr; antioxidant gene expression (TXNRD1, TXNRD2, HMOX1) reduced &rarr; metabolic syndrome, insulin resistance, blunted exercise adaptation.</p>

    <h3>Pathways</h3>
    <ul>
        <li>AMPK-mTORC1 energy sensing and metabolic switching</li>
        <li>AMPK-PGC-1alpha mitochondrial biogenesis</li>
        <li>AMPK-Nrf2 antioxidant gene expression</li>
        <li>LKB1/CAMKK2 upstream kinase axis</li>
        <li>SIRT1-LKB1-AMPK NAD+ sensing axis</li>
        <li>AMPK-autophagy/mitophagy</li>
    </ul>

    <h3>Nutrients &amp; Cofactors</h3>
    <ul>
        <li><strong>Magnesium</strong> — LKB1 complex function (requires magnesium-bound ATP)</li>
        <li><strong>B3/NAD+/NMN/NR</strong> — SIRT1 activation &rarr; LKB1 &rarr; AMPK</li>
        <li><strong>Berberine</strong> — CAMKK2 activation and mild AMP signal (Complex I modulation)</li>
        <li><strong>Resveratrol</strong> — SIRT1 activation &rarr; LKB1 &rarr; AMPK</li>
        <li><strong>Omega-3 (EPA/DHA, algae-derived)</strong> — GPR120 signalling &rarr; AMPK activation</li>
        <li><strong>CoQ10/ubiquinol</strong> — downstream AMPK-PGC-1alpha mitochondrial support</li>
        <li><strong>Zinc</strong> — LKB1 complex structural integrity and Nrf2 transcriptional machinery</li>
        <li><strong>Vitamin B6 (P5P)</strong> — CAMKK2 cofactor and ALA-to-EPA/DHA conversion support</li>
    </ul>

    <h3>Hindered By</h3>
    <ul>
        <li>Chronic mTORC1 overactivation</li>
        <li>Chronic high caloric intake</li>
        <li>Low NAD+ status</li>
        <li>Sedentary lifestyle</li>
        <li>Chronic inflammation (TNF-alpha, IL-6 suppress AMPK)</li>
        <li>High insulin / chronic hyperinsulinaemia (PI3K/Akt/mTORC1 suppresses AMPK)</li>
        <li>Alcohol (impairs LKB1 and depletes NAD+)</li>
        <li>Glucocorticoid excess (suppresses PGC-1alpha downstream of AMPK)</li>
    </ul>

</body>
</html>
`