from os import listdir
from os.path import isfile, join
import json

import yaml
import markdown2

PATH = "."
locations = {}
with open("../_data/locations.yml") as f:
  locations = yaml.safe_load(f.read())
OUTPUT = 'all.json'

def location_of(mapping):
    mapping = mapping.split(', ')
    mapping.reverse()
    iter = locations
    for map in mapping:
        if map not in iter:
            return None
        iter = iter[map]
    return {
        'latitude': float(iter['latitude']),
        'longitude': float(iter['longitude'])
    }

def read_book(filename):
    parts = filename.split('-')
    book = {}

    with open(join(PATH, filename)) as file:
        state = 0
        yaml_str = ''
        md = ''
        for line in file:
            if line == '---\n':
                state += 1
                continue
            if state == 1:
                yaml_str += line
            else:
                md += line
        book = yaml.safe_load(yaml_str)

        book['title'] = ' '.join(parts[3:])[:-3]
        book['id'] = book['title']
        book['readOn'] = f'{parts[0]}-{parts[1]}-{parts[2]}'
        map_parts = book['mapping'].split(', ') if 'mapping' in book else []

        book['mapping'] = [", ".join(map_parts[i:]) for i in range(len(map_parts))]
        if 'tags' in book:
            book['tags'] = book['tags'].split(' ')
        if md:
            book['review'] = markdown2.markdown(md)
    return book

def main():
    books = []
    for filename in listdir(PATH):
        if isfile(join(PATH, filename)) and filename.endswith('.md'):
          books.append(read_book(filename))
    authors = {}
    locations = {}
    tags = {}
    for book in books:
        if book and 'author' not in book or 'layout' not in book or book['layout'] != 'post':
          continue
        if 'tags' in book:
            for tag in book['tags']:
                if tag not in tags:
                    tags[tag] = {'id': tag, 'layout': 'tag'}
        if not book['author'] in authors:
            authors[book['author']] = {'id': book['author'], 'layout': 'author'}
        author = authors[book['author']]
        if 'gender' in book:
            author['gender'] = book['gender']
        if 'mapping' in book and len(book['mapping']) > 0:
            author['mapping'] = book['mapping']
            author['location'] = location_of(book['mapping'][0])
            for map_part in author['mapping']:
                if map_part not in locations:
                    loc = location_of(map_part)
                    if loc:
                        locations[map_part] = loc
                        locations[map_part]['id'] = map_part
                        locations[map_part]['layout'] = 'location'
                    else:
                        locations[map_part] = {
                            'id': map_part,
                            'layout': 'location'
                        }
                        
    for book in books:
        if 'mapping' not in book and 'mapping' in authors[book['author']]:
            book['mapping'] = authors[book['author']]['mapping']
        if 'gender' not in book and 'gender' in authors[book['author']]:
            book['gender'] = authors[book['author']]['gender']
        if 'mapping' in book and len(book['mapping']) > 0:
            book['location'] =  location_of(book['mapping'][0])
                
    ids = []
    for book in books:
        id = book['id']
        if id in ids:
            print(f'Oh no! {id}')
        ids.append(id)
    items = books + list(authors.values()) + list(locations.values()) + list(tags.values())
    print(len(authors.values()))
    with open(OUTPUT, 'w') as out:
        json.dump(items, out, indent=2, default=str)

main()