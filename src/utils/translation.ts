type ILang = "zh" | "en"

interface ITranslationDict {
    [key: string]: string
}

interface ITranslationDicts {
    [lang: string]: ITranslationDict
}