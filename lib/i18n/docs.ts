import { defineTranslations } from "fumadocs-core/i18n";
import { i18nProvider, uiTranslations } from "fumadocs-ui/i18n";
import type { Language } from "@/lib/i18n/translations";

const ptDocsTranslations = defineTranslations()
  .extend(uiTranslations())
  .add({
    displayName: "Português",
    "Back to Home(404 page)": "Voltar ao início",
    "Choose a language(language switcher)": "Escolher idioma",
    "Choose a language(language switcher)(aria-label)": "Escolher idioma",
    "Close Banner(banner)(aria-label)": "Fechar aviso",
    "Close Search(search dialog)(aria-label)": "Fechar busca",
    "Collapse Sidebar(sidebar)(aria-label)": "Recolher barra lateral",
    "Copied Text(code block)(aria-label)": "Texto copiado",
    "Copy Anchor Link(heading anchor)(aria-label)": "Copiar link da seção",
    "Copy Link(accordion)(aria-label)": "Copiar link",
    "Copy Markdown(page actions)": "Copiar Markdown",
    "Copy Text(code block)(aria-label)": "Copiar texto",
    "Dark(theme switcher)(aria-label)": "Escuro",
    "Default(type table)": "Padrão",
    "Edit on GitHub(edit page)": "Editar no GitHub",
    "Last updated on(page footer)": "Última atualização em",
    "Light(theme switcher)(aria-label)": "Claro",
    "Next Page(pagination)": "Próxima página",
    "No Headings(table of contents)": "Sem seções",
    "No results found(search dialog)": "Nenhum resultado encontrado",
    "On this page(table of contents)": "Nesta página",
    "Open Search(search trigger)(aria-label)": "Abrir busca",
    "Open Sidebar(sidebar)(aria-label)": "Abrir barra lateral",
    "Open in ChatGPT(page actions)": "Abrir no ChatGPT",
    "Open in Claude(page actions)": "Abrir no Claude",
    "Open in Cursor(page actions)": "Abrir no Cursor",
    "Open in GitHub(page actions)": "Abrir no GitHub",
    "Open in Scira AI(page actions)": "Abrir no Scira AI",
    "Open(page actions)": "Abrir",
    "Page Not Found(404 page)": "Página não encontrada",
    "Parameters(type table)": "Parâmetros",
    "Previous Page(pagination)": "Página anterior",
    "Prop(type table)": "Prop",
    "Read {url}, I want to ask questions about it.(page actions)":
      "Leia {url}, eu quero fazer perguntas sobre isso.",
    "Returns(type table)": "Retorno",
    "Search(search dialog)": "Buscar",
    "Search(search trigger)": "Buscar",
    "System(theme switcher)(aria-label)": "Sistema",
    "Table of Contents(inline table of contents)": "Sumário",
    "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 page)":
      "A página que você está procurando pode ter sido removida, teve seu nome alterado, ou está temporariamente indisponível.",
    "Toggle Menu(mobile menu)(aria-label)": "Alternar menu",
    "Toggle Theme(theme switcher)(aria-label)": "Alternar tema",
    "Type(type table)": "Tipo",
    "View as Markdown(page actions)": "Ver como Markdown",
  });

export function getDocsI18nProviderProps(lang: Language) {
  return lang === "pt" ? i18nProvider(ptDocsTranslations) : undefined;
}
