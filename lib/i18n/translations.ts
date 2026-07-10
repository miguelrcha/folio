export type Language = "en" | "pt";

export const LANGUAGE_COOKIE = "folio_lang";

export const SUPPORTED_LANGUAGES: Language[] = ["en", "pt"];

export function isSupportedLanguage(value: string | undefined | null): value is Language {
  return value === "en" || value === "pt";
}

type Dictionary = Record<string, string>;

export const translations: Record<Language, Dictionary> = {
  en: {
    // Header
    "header.features": "Features",
    "header.examples": "Examples",
    "header.docs": "Docs",
    "header.resources.publicProfile": "Public Profile",
    "header.resources.resumePdf": "Resume in PDF",
    "header.resources.autoSelection": "Automatic Selection",
    "header.showExamples": "Show examples",
    "header.signIn": "Sign in with GitHub",
    "header.language": "Language",

    // Search (Header/ProfileHeader)
    "search.placeholder": "Search Github username",

    // Home hero
    "home.hero.title": "Build your Github portfolio in minutes",
    "home.hero.subtitle": "Connect your Github. In less than a minute, get a professional",
    "home.hero.subtitleLine2": "resume, always up-to-date and ready to send.",
    "home.hero.inputPlaceholder": "github.com/miguelrcha",
    "home.hero.checking": "Checking…",
    "home.hero.viewProfile": "View Profile on Folio",
    "home.hero.notFound": "isn't registered on Folio yet.",

    // CTA section
    "cta.title": "Start testing in minutes",
    "cta.subtitle": "Connect your GitHub repos, and get a public profile and resume",
    "cta.subtitleLine2": "fully set up in a few clicks.",
    "cta.getStarted": "Get started",
    "cta.viewExample": "View example →",

    // Feature showcase
    "features.title": "Everything from your GitHub",
    "features.subtitle":
      "A public profile, a PDF resume, and a curated selection of your best projects — all generated from your GitHub, without filling in anything by hand.",
    "features.publicProfile.title": "Public Profile",
    "features.publicProfile.description":
      "A page at meufolio.dev/@you with your bio, real stack, and projects ranked by impact — always up to date.",
    "features.pdfResume.title": "PDF Resume",
    "features.pdfResume.description":
      "One click and the same profile becomes a ready-to-send resume — complete with your GitHub photo and projects included.",
    "features.autoSelection.title": "Automatic Selection",
    "features.autoSelection.description":
      "Projects with the most stars and recent activity come pre-selected — you just adjust if you want.",
    "features.table.repository": "Repository",
    "features.table.impact": "Impact",
    "features.table.selectProjects": "Select your projects",

    // Footer
    "footer.product": "Product",
    "footer.company": "Company",
    "footer.openSource": "Open Source",
    "footer.rights": "All rights reserved.",

    // Login
    "login.joinDevs": "Join several other devs",
    "login.readOnly": "read-only · no write access to your repositories",

    // Connect / onboarding
    "connect.step.connecting": "connecting to the github api",
    "connect.step.reading": "reading public repositories",
    "connect.step.analyzing": "analyzing languages and stacks",
    "connect.step.calculating": "calculating impact per project",
    "connect.error.title": "Couldn't sync with GitHub right now. Try again?",
    "connect.error.backToLogin": "Back to login",
    "connect.select.title": "Choose what goes in your resume",
    "connect.select.subtitle":
      "We pre-selected the projects with the highest impact (stars, commits, and recent activity). Adjust as you like.",
    "connect.select.noRepos": "No repositories found on this account.",
    "connect.select.noDescription": "no description",
    "connect.select.impact": "impact",
    "connect.select.projectSelected": "project selected",
    "connect.select.projectsSelected": "projects selected",
    "connect.select.generating": "Generating...",
    "connect.select.generate": "Generate my Folio →",

    // Profile page
    "profile.stats.followers": "followers",
    "profile.stats.publicRepos": "public repositories",
    "profile.stats.totalCommits": "total commits",
    "profile.stats.onGithubSince": "on github since",
    "profile.section.overview": "overview",
    "profile.section.experiences": "experiences",
    "profile.section.stacks": "stacks",
    "profile.section.projects": "projects, by impact",
    "profile.section.certificates": "certificates",
    "profile.section.languages": "languages",
    "profile.empty.summary": "no summary yet.",
    "profile.empty.experiences": "No professional experience added yet.",
    "profile.empty.stacks": "No stacks added yet.",
    "profile.empty.projects": "No projects selected yet.",
    "profile.empty.certificates": "No certifications added yet.",
    "profile.empty.languages": "No languages added yet.",
    "profile.noDescription": "no description",
    "profile.forks": "forks",
    "profile.footer.generated": "generated automatically from github",
    "profile.footer.github": "Github",
  },
  pt: {
    // Header
    "header.features": "Recursos",
    "header.examples": "Exemplos",
    "header.docs": "Docs",
    "header.resources.publicProfile": "Perfil Público",
    "header.resources.resumePdf": "Currículo em PDF",
    "header.resources.autoSelection": "Seleção Automática",
    "header.showExamples": "Ver exemplos",
    "header.signIn": "Entrar com GitHub",
    "header.language": "Idioma",

    // Search (Header/ProfileHeader)
    "search.placeholder": "Buscar usuário do Github",

    // Home hero
    "home.hero.title": "Monte seu portfólio do Github em minutos",
    "home.hero.subtitle": "Conecte seu Github. Em menos de um minuto, tenha um currículo",
    "home.hero.subtitleLine2": "profissional, sempre atualizado e pronto para enviar.",
    "home.hero.inputPlaceholder": "github.com/miguelrcha",
    "home.hero.checking": "Verificando…",
    "home.hero.viewProfile": "Ver Perfil no Folio",
    "home.hero.notFound": "ainda não está registrado no Folio.",

    // CTA section
    "cta.title": "Comece a testar em minutos",
    "cta.subtitle": "Conecte seus repositórios do GitHub e tenha um perfil público e currículo",
    "cta.subtitleLine2": "totalmente configurados em poucos cliques.",
    "cta.getStarted": "Começar agora",
    "cta.viewExample": "Ver exemplo →",

    // Feature showcase
    "features.title": "Tudo a partir do seu GitHub",
    "features.subtitle":
      "Um perfil público, um currículo em PDF, e uma seleção curada dos seus melhores projetos — tudo gerado a partir do seu GitHub, sem preencher nada manualmente.",
    "features.publicProfile.title": "Perfil Público",
    "features.publicProfile.description":
      "Uma página em meufolio.dev/@voce com sua bio, stack real, e projetos ranqueados por impacto — sempre atualizada.",
    "features.pdfResume.title": "Currículo em PDF",
    "features.pdfResume.description":
      "Um clique e o mesmo perfil vira um currículo pronto para enviar — completo, com sua foto do GitHub e projetos incluídos.",
    "features.autoSelection.title": "Seleção Automática",
    "features.autoSelection.description":
      "Projetos com mais estrelas e atividade recente já vêm pré-selecionados — você só ajusta se quiser.",
    "features.table.repository": "Repositório",
    "features.table.impact": "Impacto",
    "features.table.selectProjects": "Selecione seus projetos",

    // Footer
    "footer.product": "Produto",
    "footer.company": "Empresa",
    "footer.openSource": "Código Aberto",
    "footer.rights": "Todos os direitos reservados.",

    // Login
    "login.joinDevs": "Junte-se a vários outros devs",
    "login.readOnly": "somente leitura · sem acesso de escrita aos seus repositórios",

    // Connect / onboarding
    "connect.step.connecting": "conectando à api do github",
    "connect.step.reading": "lendo repositórios públicos",
    "connect.step.analyzing": "analisando linguagens e stacks",
    "connect.step.calculating": "calculando impacto por projeto",
    "connect.error.title": "Não foi possível sincronizar com o GitHub agora. Tentar de novo?",
    "connect.error.backToLogin": "Voltar ao login",
    "connect.select.title": "Escolha o que vai no seu currículo",
    "connect.select.subtitle":
      "Pré-selecionamos os projetos com maior impacto (estrelas, commits, e atividade recente). Ajuste como preferir.",
    "connect.select.noRepos": "Nenhum repositório encontrado nessa conta.",
    "connect.select.noDescription": "sem descrição",
    "connect.select.impact": "impacto",
    "connect.select.projectSelected": "projeto selecionado",
    "connect.select.projectsSelected": "projetos selecionados",
    "connect.select.generating": "Gerando...",
    "connect.select.generate": "Gerar meu Folio →",

    // Profile page
    "profile.stats.followers": "seguidores",
    "profile.stats.publicRepos": "repositórios públicos",
    "profile.stats.totalCommits": "commits totais",
    "profile.stats.onGithubSince": "no github desde",
    "profile.section.overview": "resumo",
    "profile.section.experiences": "experiências",
    "profile.section.stacks": "stacks",
    "profile.section.projects": "projetos, por impacto",
    "profile.section.certificates": "certificados",
    "profile.section.languages": "idiomas",
    "profile.empty.summary": "ainda sem resumo.",
    "profile.empty.experiences": "Nenhuma experiência profissional adicionada ainda.",
    "profile.empty.stacks": "Nenhuma stack adicionada ainda.",
    "profile.empty.projects": "Nenhum projeto selecionado ainda.",
    "profile.empty.certificates": "Nenhuma certificação adicionada ainda.",
    "profile.empty.languages": "Nenhum idioma adicionado ainda.",
    "profile.noDescription": "sem descrição",
    "profile.forks": "forks",
    "profile.footer.generated": "gerado automaticamente a partir do github",
    "profile.footer.github": "Github",
  },
};

export function translate(
  lang: Language,
  key: string,
  vars?: Record<string, string | number>
): string {
  const dict = translations[lang] ?? translations.en;
  let str = dict[key] ?? translations.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}
