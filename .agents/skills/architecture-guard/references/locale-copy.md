# Locale-owned copy

Read this when adding a string a person sees in product chrome.

Chrome strings go through the locale dictionary. A new key lands in `en` and `zh-CN` in the same change. User text, model text, and wire data stay verbatim.

## Example

```ts
const en = { save: 'Save' }
const zhCN = { save: '保存' }

export function label(locale: 'en' | 'zh-CN', key: 'save'): string {
  return locale === 'zh-CN' ? zhCN[key] : en[key]
}
```

Effect:

- A component calls `label(locale, 'save')`. It does not contain the English sentence.
- Adding `cancel` to `en` without `zhCN.cancel` fails the build once both dictionaries share one key type.
- A log line, a commit hash, and a model response are not passed through `label`.

## Not this

```tsx
export function SaveButton(): JSX.Element {
  return <button>Save</button>
}
```

Effect of the mistake: the Chinese locale still shows `Save`. The missing key is invisible until someone reads the component.
