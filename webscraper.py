import re
import requests 
from bs4 import BeautifulSoup 
import pandas as pd 

headers_req = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

furniture_urls = {} 
furniture = [] 
category_urls = ['https://www.ikea.com/us/en/cat/kitchen-base-cabinets-24254/', 
                 'https://www.ikea.com/us/en/cat/storage-organization-st001/'] 

def extract(soup, category, url):
    page = soup.get_text()

    title = soup.find('h1')
    name = title.text.strip().replace('\n', ' ').replace('"', ' ') if title else 'N/A'

    color = re.search(r'color:\s*([\w\s-]+)', page, re.IGNORECASE)
    color = color.group(1).strip() if color else 'white'

    boxes = soup.find_all('div', class_=re.compile(r'pip-product-dimensions__measurement', re.I))

    extracted = []

    if boxes:
        for box in boxes:
            btext = box.get_text()
            width = re.search(r'width:\s*([\d\.\/\s]+)', btext, re.IGNORECASE)
            depth = re.search(r'depth:\s*([\d\.\/\s]+)', btext, re.IGNORECASE)
            height = re.search(r'height:\s*([\d\.\/\s]+)', btext, re.IGNORECASE)

            width = width.group(1).strip() if width else '30'
            depth = depth.group(1).strip() if depth else '24'
            height = height.group(1).strip() if height else '34.5'

            extracted.append({
                'name': name,
                'color': color,
                'width': width,
                'depth': depth,
                'height': height,
                'category': category,
                'url': url
            })
    else:
        width = re.search(r'width:\s*([\d\.\/\s]+)', page, re.IGNORECASE)
        depth = re.search(r'depth:\s*([\d\.\/\s]+)', page, re.IGNORECASE)
        height = re.search(r'height:\s*([\d\.\/\s]+)', page, re.IGNORECASE)

        width = width.group(1).strip() if width else '30'
        depth = depth.group(1).strip() if depth else '24'
        height = height.group(1).strip() if height else '34.5'

        extracted.append({
            'name': name,
            'color': color,
            'width': width,
            'depth': depth,
            'height': height,
            'category': category,
            'url': url
        })

    return extracted

for url in category_urls: 
    try:
        response = requests.get(url, headers=headers_req, timeout=5) 
        soup = BeautifulSoup(response.content, 'html.parser') 

        links = soup.find_all('a') 
        products_urls = [] 

        for link in links: 
            href = link.get('href') 
            if href and '/p/' in href: 
                if not href.startswith('http'): 
                    href = 'https://www.ikea.com' + href 
                if href not in products_urls: 
                    products_urls.append(href) 

        category_key = url.split("/cat/")[1].strip("/").rsplit("-", 1)[0].replace("-", " ")
        furniture_urls[category_key] = products_urls 
    except Exception as e:
        print(f"skipping {url} due to error {e}")

for category, url_list in furniture_urls.items(): 
    for url in url_list: 
        try:
            response = requests.get(url, headers=headers_req, timeout=5) 
            soup = BeautifulSoup(response.content, 'html.parser') 

            furniture.extend(extract(soup, category, url))
        except Exception as e:
            print(f"skipping {url} due to error {e}")

df = pd.DataFrame(furniture)
headers = ['name', 'color', 'width', 'depth', 'height', 'category', 'url']
df.to_csv('furniture_catalogue.csv', columns=headers, index=False)
print(f"Succesfully exported {len(furniture)} items to catalogue")