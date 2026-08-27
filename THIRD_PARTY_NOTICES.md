# Third-Party Notices

## fortuneteller (hjsh200219/fortuneteller)

The contents of `src/data/`, `src/lib/`, `src/types/`, and `src/utils/` are copied
verbatim from [hjsh200219/fortuneteller](https://github.com/hjsh200219/fortuneteller),
licensed under the MIT License (declared via that repository's `package.json`
`"license": "MIT"` field and README; the upstream repository does not ship a
standalone `LICENSE` file at the time of copying).

```
MIT License

Copyright (c) 2025 Hoshin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Note on timezone dependencies

`date-fns` and `date-fns-tz` (pinned to `^3`, matching the upstream code's use
of the v3-only `fromZonedTime` API and `toDate(value, { timeZone })` signature)
are dependencies used exclusively by `src/lib/` and `src/utils/date.ts` to
perform precise 진태양시(true solar time) correction for Saju pillar
calculation — birth-city longitude offset against 동경 135° and historical
Korean DST rules. They are intentionally scoped to this lib layer and should
not be imported from UI components or treated as general app-wide
date-formatting utilities.
