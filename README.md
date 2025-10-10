# 🧬 Genetic Data Personalization Tool

A client-side web application that automates the personalization of genetic data explanation templates using raw genetic data files from 23andMe, Ancestry.com, or SelfDecode.

## Features

- **File Format Detection**: Automatically identifies and parses genetic data files from multiple providers
- **Template Processing**: Transforms Google Doc templates with RS ID placeholders into personalized reports
- **Zygosity Determination**: Identifies Homozygous, Heterozygous, Wild Type, or Missing Data for each SNP
- **Summary Generation**: Calculates and displays statistics for each section and overall report
- **Allele Reference Table**: Inspectable and editable table of wild/problem alleles with verification links
- **Hide/Show Wild Type**: Toggle to hide SNP subsections that are all wild type
- **Export Options**: Download reports as HTML or copy to clipboard
- **100% Client-Side**: All processing happens in your browser - no data is uploaded to any server

## Setup

### Prerequisites

- Node.js (v20.19.0 or higher, or v22.12.0+) - **Important: v18.15.0 may have compatibility issues with Vite 7**
- npm or yarn

### Installation

1. Clone or navigate to the project directory:
```bash
cd /Users/david/Projects/rlgenes
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

**Note:** If you encounter module import errors with Node.js v18.15.0, you have two options:
- **Option A (Recommended):** Upgrade Node.js to v20.19.0+ or v22.12.0+
- **Option B:** Build and preview the production version:
  ```bash
  npm run build
  npm run preview
  ```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173` for dev or `http://localhost:4173` for preview)

## Usage

### Step 1: Upload Template

You have three options to load a template:

1. **Upload File**: Export your Google Doc as HTML (File → Download → Web Page (.html, zipped)), extract the HTML file, and upload it
2. **Paste HTML**: Copy and paste the HTML content directly
3. **Google Doc URL**: Enter a publicly accessible Google Doc URL (limited by CORS)

The template should contain RS IDs in the format `rs1234567` or `RS1234567`. These will be replaced with their zygosity status.

### Step 2: Upload Genetic Data

Select your raw genetic data file from one of the supported providers:
- **23andMe**: Tab-delimited text file with rsid, chromosome, position, and genotype columns
- **Ancestry.com**: CSV file with rsid, chromosome, position, allele1, and allele2 columns
- **SelfDecode**: CSV file with rsid, chromosome, position, and genotype columns

The application will automatically detect the file format. If it cannot determine the format, you'll receive an alert.

### Step 3: Generate Report

1. Optionally, check "Hide Wild Type SNP subsections" to hide SNP entries where all RS IDs are wild type
2. Click the "🧬 Generate Report" button
3. View the transformed template with:
   - RS IDs replaced with their zygosity status
   - Color coding:
     - **Red/Bold**: Homozygous variants
     - **Black**: Heterozygous variants
     - **Green**: Wild type
     - **Grey**: Data missing
   - Section summaries with percentages
   - Grand summary table

### Step 4: Export or Copy

Use the buttons at the top of the report to:
- **Copy to Clipboard**: Copy the HTML report for pasting elsewhere
- **Download HTML**: Save the report as an HTML file

## File Structure

```
rlgenes/
├── public/
│   ├── allele_data.json          # Reference allele data
│   ├── example_23andme.txt       # Example 23andMe data file
│   ├── example_ancestry.txt      # Example Ancestry data file
│   ├── example_selfdecode.csv    # Example SelfDecode data file
│   └── example_template.html     # Example template for testing
├── src/
│   ├── components/
│   │   ├── FileUpload.tsx        # File upload component
│   │   ├── TemplateInput.tsx     # Template input component
│   │   ├── AlleleReferenceTable.tsx  # Allele reference table
│   │   └── ReportOutput.tsx      # Report display component
│   ├── utils/
│   │   ├── formatDetector.ts     # Genetic file format detection
│   │   ├── geneticDataParser.ts  # File parsing logic
│   │   └── templateProcessor.ts  # Template transformation logic
│   ├── types.ts                  # TypeScript type definitions
│   ├── App.tsx                   # Main application component
│   ├── App.css                   # Application styles
│   └── main.tsx                  # Application entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Testing

### Using Example Files

The application includes example files in the `public/` directory:

1. Open the application in your browser
2. Upload the example template: `public/example_template.html`
3. Upload one of the example genetic data files:
   - `public/example_23andme.txt`
   - `public/example_ancestry.txt`
   - `public/example_selfdecode.csv`
4. Click "Generate Report" to see the results

## Allele Reference Table

The allele reference table (`public/allele_data.json`) contains:
- **RS ID**: The SNP identifier
- **Wild Allele**: The common/reference allele
- **Problem Allele**: The risk/variant allele
- **Confirmation URL**: Link to verify allele designations (dbSNP, SNPedia, etc.)

You can view and edit this table directly in the application by expanding the "Allele Reference Table" section.

## Template Format

Templates should be structured with:
- **Section Headings**: Use `<h3>` tags for main sections
- **SNP Subsections**: Use `<li class="c1 li-bullet-0">` or similar for individual SNP entries
- **RS IDs**: Include RS IDs in the format `rs1234567` anywhere in the text
- **Summary Placeholders**: Add "Summary Placeholder" or "Summary Block" where you want statistics inserted

Example template structure:
```html
<h3>Section Name</h3>
<p>Intro: Introduction text...</p>
<p>SNPs:</p>
<ul>
  <li>Gene Name (rs1234567) [Genotype Placeholder]<br>
  Description of the SNP...</li>
  <li>Another Gene (rs7654321) [Genotype Placeholder]<br>
  Description...</li>
</ul>
<hr>
<p>Summary Placeholder:</p>
```

## Technical Details

### Dependencies

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **PapaParse**: CSV parsing (installed but not currently used - kept for future enhancements)
- **DOMPurify**: HTML sanitization

### Browser Compatibility

- Modern browsers with ES6+ support
- Requires support for:
  - FileReader API
  - DOMParser
  - Clipboard API (for copy functionality)

## Privacy & Security

- **No Server Communication**: All processing happens locally in your browser
- **No Data Storage**: Files are processed in memory and not stored
- **No Analytics**: No tracking or analytics
- **HTML Sanitization**: Output HTML is sanitized to prevent XSS attacks

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service.

## Troubleshooting

### "Unable to determine file format" Error

- Ensure your genetic data file is from 23andMe, Ancestry.com, or SelfDecode
- Check that the file has proper headers (rsid, chromosome, position, genotype/alleles)
- Make sure the file is not corrupted

### Template Not Loading

- Verify the HTML file is valid
- For Google Doc URLs, ensure the document is publicly accessible
- Check browser console for CORS errors when using URL input

### RS IDs Not Being Replaced

- Ensure RS IDs are in the correct format: `rs` followed by digits
- Check that the genetic data file contains the RS IDs mentioned in the template
- Verify the genetic data was successfully loaded (check for the green status message)

## Contributing

To add support for additional genetic data providers:

1. Update `formatDetector.ts` to recognize the new format
2. Modify `geneticDataParser.ts` if special parsing logic is needed
3. Add example data files to the `public/` directory
4. Update documentation

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions, please check:
- The example files in the `public/` directory
- Browser console for error messages
- This README for common troubleshooting steps
