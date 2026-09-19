import re
import requests 
from bs4 import BeautifulSoup 
import pandas as pd 

headers_req = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

furniture_urls = {} 
furniture = [] 
category_urls = ['https://www.ikea.com/us/en/cat/kitchen-base-cabinets-24254/', 
                 'https://www.ikea.com/us/en/cat/wall-cabinets-23607/',
                 'https://www.ikea.com/us/en/cat/high-cabinets-23608/',
                 'https://www.ikea.com/us/en/cat/kitchen-islands-carts-10471/',
                 'https://www.ikea.com/us/en/cat/storage-organization-st001/',
                 'https://www.ikea.com/us/en/cat/sofas-sectionals-fu003/',
                 'https://www.ikea.com/us/en/cat/coffee-side-tables-10705/',
                 'https://www.ikea.com/us/en/cat/tv-media-furniture-10475/',
                 'https://www.ikea.com/us/en/cat/beds-bm003/',
                 'https://www.ikea.com/us/en/cat/wardrobes-19053/',
                 'https://www.ikea.com/us/en/cat/chest-of-drawers-10451/',
                 'https://www.ikea.com/us/en/cat/nightstands-20454/',
                 'https://www.ikea.com/us/en/cat/appliances-10471/',
                 'https://www.ikea.com/us/en/cat/lighting-li001/',
                 'https://www.ikea.com/us/en/cat/rugs-10653/',
                 'https://www.ikea.com/us/en/cat/dining-tables-21825/',
                 'https://www.ikea.com/us/en/cat/dining-chairs-25219/',
                 'https://www.ikea.com/us/en/cat/desks-computer-desks-20649/'] 

def nums(n):
    n = n.strip()
    if '/' in n:
        parts = n.split()
        if len(parts) == 2:
            whole, frac = parts
            num, denom = frac.split('/')
            return float(whole) + float(num) / float(denom)
        elif len(parts) == 1:
            num, denom = parts[0].split('/')
            return float(num) / float(denom)
    n = float(n)
    return int(n) if n.is_integer() else n

def extract(soup, category, url):
    page = soup.get_text()

    title = soup.find('h1')
    name = title.text.strip().replace('\n', ' ').replace('"', ' ') if title else 'N/A'

    dim = r'(\d+(?:\s+\d+/\d+|\.\d+)?)\s*x\s*(\d+(?:\s+\d+/\d+|\.\d+)?)\s*x\s*(\d+(?:\s+\d+/\d+|\.\d+)?)'
    dimTitle = re.search(dim, name, re.IGNORECASE)

    if dimTitle:
        width = nums(dimTitle.group(1))
        depth = nums(dimTitle.group(2))
        height = nums(dimTitle.group(3))

        name = re.sub(dim, '', name, flags=re.IGNORECASE).strip(' ,')
    else:
        width = re.search(r'width:\s*([\d\.\/\s]+)', page, re.IGNORECASE)
        depth = re.search(r'depth:\s*([\d\.\/\s]+)', page, re.IGNORECASE)
        height = re.search(r'height:\s*([\d\.\/\s]+)', page, re.IGNORECASE)

        width = nums(width.group(1)) if width else 30
        depth = nums(depth.group(1)) if depth else 24
        height = nums(height.group(1)) if height else 34.5

    if ',' in name:
        parts = name.rsplit(',', 1)
        name = parts[0].strip()
        color = parts[1].strip().title()
    else:
        color = re.search(r'color:\s*([\w\s/-]{2,20})', page, re.IGNORECASE)
        color = color.group(1).strip().title() if color else 'White'

    if any(x in color.lower() for x in ['choose', 'size', 'front', 'how to']): 
        color = "white" 
    elif any(char.isdigit() for char in color):
        return []

    return ([{
            'name': name,
            'color': color,
            'width': width,
            'depth': depth,
            'height': height,
            'category': category,
            'url': url
            }])

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