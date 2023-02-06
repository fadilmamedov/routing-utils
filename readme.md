### Description

Small utility allowing to validate route parameters: distance, duration etc.

### Running

##### Without options (interactive session)

```ts
npm run main
```

##### With options

```sh
npm run main -f GoBolt -s yyz -d 2023-01-20 -r 0c50d9c2-a5b8-11ed-8b30-7fca111d0cd1 -t 09:00
```

### Command line options

| Name           | Option            | Alias | Supported values / format                                            |
| -------------- | ----------------- | ----- | -------------------------------------------------------------------- |
| Flow           | `--flow`          | `-f`  | `GoBolt`, `IKEA`                                                     |
| Service area   | `--serviceArea`   | `-s`  | `yyz`, `yul`, `yvr`, `yow`, `yyc`, `lax`, `hou`, `mia`, `nyc`, `atl` |
| Date           | `--date`          | `-d`  | `YYYY-MM-DD`                                                         |
| Route          | `--route`         | `-r`  |                                                                      |
| Departure time | `--departureTime` | `-t`  | `HH:mm`                                                              |

### Notes

- Any option can be skipped. In that case you will be asked to select option value interactively
- Be careful with options. There is no validation at the moment
