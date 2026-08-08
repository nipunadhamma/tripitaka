# Suththa.org — සම්පූර්ණ ත්‍රිපිටක ධර්ම ග්‍රන්ථාලය

Suththa.org යනු පාලි ත්‍රිපිටක මූල ග්‍රන්ථ, සිංහල පරිවර්තන සහ අදාළ ධර්ම ග්‍රන්ථ සංවිධානාත්මකව අධ්‍යයනය කිරීමට නිර්මාණය කරන වෙබ්-පාදක ධර්ම ග්‍රන්ථාලයකි.

මෙම ව්‍යාපෘතියේ ප්‍රධාන අරමුණ වන්නේ ත්‍රිපිටක ග්‍රන්ථ සරල, වේගවත් සහ අධ්‍යයනයට පහසු Reader interface එකක් තුළ ලබාදීමයි.

## ප්‍රධාන විශේෂාංග

* 📚 ත්‍රිපිටක වෘක්ෂය (Tipitaka Tree)
* 📖 විනය පිටකය
* 📖 සූත්‍ර පිටකය
* 📖 අභිධර්ම පිටකය
* 📜 අටුවා සහ අනෙකුත් ග්‍රන්ථ සඳහා පුළුල් කළ හැකි data structure එක
* 🅿️ Pāli text display
* 🇱🇰 සිංහල text display
* 🔄 Pāli + සිංහල එකවර කියවීම
* 📄 Pāli පමණක් කියවීම
* 📄 සිංහල පමණක් කියවීම
* 🌳 Expandable / collapsible book tree
* 📱 Desktop සහ mobile responsive interface
* 🔎 ඉදිරියේදී පුළුල් කිරීමට සැලසුම් කළ search system
* 📚 Dictionary integration සඳහා වෙන් කළ architecture
* 📝 Notes සහ bookmarks සඳහා වෙන් කළ architecture
* 🤖 AI-assisted study features සඳහා වෙන් කළ architecture

---

# Project Architecture

Suththa.org ව්‍යාපෘතිය modular architecture එකක් අනුව සංවිධානය කර ඇත.

```text
Suththa.org/
│
├── index.html
├── reader.html
├── search.html
├── dictionary.html
├── profile.html
│
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── components/
│   ├── ai-panel/
│   ├── book-tree/
│   ├── header/
│   ├── note-panel/
│   ├── reader-panel/
│   ├── search-box/
│   └── word-popup/
│
├── css/
│   ├── variables.css
│   ├── fonts.css
│   ├── main.css
│   ├── layout.css
│   ├── components.css
│   ├── reader.css
│   ├── search.css
│   ├── dictionary.css
│   └── responsive.css
│
├── data/
│   ├── books/
│   │   └── books.json
│   │
│   ├── suttas/
│   │   ├── dn/
│   │   ├── mn/
│   │   ├── sn/
│   │   ├── an/
│   │   ├── kn/
│   │   ├── vp/
│   │   └── ap/
│   │
│   ├── translations/
│   ├── dictionary/
│   ├── indexes/
│   └── raw/
│
├── js/
│   ├── app.js
│   ├── config.js
│   │
│   ├── core/
│   ├── reader/
│   ├── search/
│   ├── dictionary/
│   ├── ai/
│   ├── user/
│   └── admin/
│
├── docs/
│
├── scripts/
├── tests/
│
└── tools/
    └── converter/
```

---

# Data Architecture

Suththa.org හි ග්‍රන්ථ දත්ත සහ Reader interface එක වෙන වෙනම තබා ඇත.

ප්‍රධාන Book Tree එක:

```text
data/books/books.json
```

Reader සඳහා සූදානම් කළ ග්‍රන්ථ:

```text
data/suttas/
```

උදාහරණයක් ලෙස:

```text
data/suttas/dn/dn-1.json
```

Book Tree එකේ:

```json
{
    "id": "dn-1",
    "type": "sutta"
}
```

වැනි node එකක් තිබේ නම් Reader එක එයට අදාළ:

```text
data/suttas/dn/dn-1.json
```

file එක load කරයි.

මෙම ක්‍රමය නිසා Tree structure එක සහ actual text data එක වෙන වෙනම කළමනාකරණය කළ හැක.

---

# Reader

Suththa.org Reader එකේ ප්‍රධාන අරමුණ වන්නේ පාලි සහ සිංහල ග්‍රන්ථ පහසුවෙන් අධ්‍යයනය කිරීමට හැකි interface එකක් ලබාදීමයි.

Reader එකේ ප්‍රධාන modes:

### Pāli + සිංහල

```text
Pāli                         සිංහල

Evaṃ me sutaṃ...             මා විසින් මෙසේ අසන ලදී...
```

### Pāli පමණයි

```text
Evaṃ me sutaṃ...

Ekaṃ samayaṃ...
```

### සිංහල පමණයි

```text
මා විසින් මෙසේ අසන ලදී...

එක් සමයෙහි...
```

Reader එකේ Book Tree එකෙන් අවශ්‍ය සූත්‍රය තෝරාගත් විට එයට අදාළ JSON data එක load කර Reader තුළ පෙන්වයි.

---

# Data Conversion

මුල් ග්‍රන්ථ දත්ත Reader එකට සුදුසු JSON format එකකට පරිවර්තනය කිරීම සඳහා:

```text
tools/converter/
```

යටතේ conversion tools භාවිතා කරයි.

ප්‍රධාන scripts:

```text
convert-sutta.py
convert-tree.py
```

`convert-sutta.py` මගින් source text data Reader-ready JSON structure එකකට පරිවර්තනය කළ හැක.

`convert-tree.py` මගින් Tripitaka book tree structure එක Suththa.org හි `books.json` structure එකට සකස් කළ හැක.

---

# Development

Suththa.org දැනට modular web application එකක් ලෙස සංවර්ධනය කරමින් පවතී.

Local development සඳහා project එක local web server එකක් හරහා run කිරීම නිර්දේශ කරයි.

උදාහරණයක්:

```text
http://127.0.0.1:5500/
```

Static JSON files `fetch()` මගින් load කරන බැවින් `file://` protocol එක වෙනුවට local HTTP server එකක් භාවිතා කිරීම වඩාත් සුදුසුය.

---

# Future Development

Suththa.org සඳහා ඉදිරියේදී පහත පහසුකම් ක්‍රමයෙන් එකතු කිරීමට සැලසුම් කර ඇත.

## Search

* Sinhala search
* Pāli search
* English search
* Fuzzy search
* Search result ranking
* Text highlighting
* සියලුම සූත්‍ර තුළ වචනයක් සෙවීම

## Dictionary

* Pāli word lookup
* Sinhala explanation
* Word analysis
* Reader එක තුළ word-click dictionary popup

## Personal Library

* Bookmarks
* Notes
* Reading history
* Personal collections

## Study Tools

* Text highlighting
* Parallel reading
* Font controls
* Dark mode
* Related Sutta discovery

## AI Study Assistant

* සූත්‍ර සාරාංශ
* පාලි වචන පැහැදිලි කිරීම
* සංකල්ප පැහැදිලි කිරීම
* සම්බන්ධ සූත්‍ර සොයාදීම
* අධ්‍යයන සහායක chat interface

---

# Source and Licensing

Suththa.org තුළ භාවිතා කරන සියලුම text data, translations, fonts, images, icons සහ වෙනත් third-party resources සඳහා ඒ ඒ source එකේ license සහ redistribution conditions අදාළ වේ.

විශේෂයෙන් Buddha Jayanthi Tipitaka text හෝ වෙනත් third-party content භාවිතා කරන විට එම content එකට අදාළ original license එක පරීක්ෂා කළ යුතුය.

Suththa.org විසින් වෙනත් ව්‍යාපෘතියක code, design හෝ content එකක් ස්වයංක්‍රීයව තමන්ගේම ලෙස ප්‍රකාශ නොකරයි.

Third-party data එකක් Suththa.org වෙත ඇතුළත් කිරීමට පෙර එහි:

* copyright
* attribution requirements
* modification conditions
* redistribution conditions

පරීක්ෂා කළ යුතුය.

---

# Project Status

Suththa.org දැනට active development අවධියේ පවතී.

දැනට ප්‍රමුඛතාව ලබාදී ඇති කොටස්:

1. Tripitaka Book Tree
2. Reader data architecture
3. Pāli / Sinhala Reader
4. Responsive Reader interface
5. Search architecture
6. Dictionary architecture
7. User features
8. AI study features

ව්‍යාපෘතියේ data structure එක සහ core architecture එක ස්ථාවර කිරීමෙන් පසුව අමතර features ක්‍රමයෙන් එකතු කරනු ලැබේ.

---

# Important

Suththa.org ව්‍යාපෘතියට third-party content එකක් ඇතුළත් කිරීමට පෙර එම content එකේ LICENSE file සහ original source එක පරීක්ෂා කරන්න.

මෙම project එකේ code, data සහ resources සඳහා අදාළ license information project එකේ `LICENSE` සහ documentation files තුළ පැහැදිලිව සටහන් කළ යුතුය.
#   t r i p i t a k a  
 