

# Chromium-based Google Maps Scraper



# Overview

This is a Google Maps Scraper using Node.js and Chromium as headless browser. It launches Chromium in headless mode and request all information about a *Type* of a business and the *Targeted City*.


# Project File Structure
**data.json** JSON File that contains all necessary pre-defined constants that are required for the program to run. For example, the path of the Chromium-based browser that it should run.

**index.js** This is the Main Node.js code that runs the scraping processes.


# Workflow (Technical) 
 The program works by passing it a few *necessary* arguments such as *List of Targeted Businesses' Type(s)* such as "restaurant, store, workshop,...etc", and *Targeted City* to lookup and scrape theses businesses from. and few *peripheral* arguments such the Number of opened tabs on the headless browser at once, the language of the information that you need it to be in..., etc.  to ensure maximum efficiency and reliability of the extracted information .
 
Currently, the program only supports those *Business Types* that are provided in the `data.json` under the `business_categoriess`. 

After passing those *necessary* arguments the program launches the Headless, browser query Google Maps to show a list of businesses that are of the required Business Type(s) and the Targeted City, 
It starts by extracting the full list of the businesses then extract each individual one's data such as Name, Address, Phone Number, Rating, Website .etc.

Each passed *Business Type* is exported individually either to file (.PDF, .JSON, .CSV) or to DynamoDB.

after all *Businesses* Have been extracted file, one MAGA file will be exported containing the full list of businesses.  
The name of the exported file should be pre-defined with descriptive name that explains itself, otherwise the default `"exports"` will be used as name to the file.

The `export`ed files are exported to the path defined in `data.json`, otherwise the *Default Path* `./exports` will be used.
# Technologies Used 

**Node.js** As the main Runtime Environment.
**Chromium** A headless browser that query the *Targeted City* and *Targeted Business Type(s)* and fetches data upon request.
**Puppeteer** Controlling Chromium-based browser to go through the scraping browser from Node.js environment.

## Notes
*This is a VERY BASIC minimalist  scraping software that doesn't have any accurate information validation mechanism, Dynamic Export file naming, Cloudflare/CAPTCHA bypassing mechanism,...etc.*
