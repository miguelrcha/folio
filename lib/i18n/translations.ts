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
    "search.notFound": "This username isn't on Folio yet.",

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
    "login.error.authFailed": "GitHub sign-in didn't complete. Try again.",
    "login.error.profileSaveFailed": "Signed in, but saving your profile failed. Try again.",

    // Fallback surfaces (404 / error boundary)
    "notFound.title": "This page doesn't exist.",
    "notFound.hint": "Looking for someone? Search the GitHub username:",
    "notFound.goHome": "← Back to home",
    "error.title": "Something went wrong on our side.",
    "error.retry": "Try again",

    // Connect / onboarding
    "connect.step.connecting": "connecting to the github api",
    "connect.step.reading": "reading public repositories",
    "connect.step.analyzing": "analyzing languages and stacks",
    "connect.step.calculating": "calculating impact per project",
    "connect.error.title": "Couldn't sync with GitHub right now. Try again?",
    "connect.error.rateLimit":
      "GitHub is rate-limiting requests at the moment. Give it a minute, then try again.",
    "connect.error.auth": "Your GitHub session needs to be renewed to continue.",
    "connect.error.tryAgain": "Try again",
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
    "connect.select.saveFailed": "Couldn't save your onboarding. Try generating again.",

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

    // Docs landing page
    "docs.title": "Documentation",
    "docs.subtitle": "Everything you need to know about how Folio turns your GitHub",
    "docs.subtitleLine2": "into a portfolio and resume.",
    "docs.readDocs": "Read the docs",
    "docs.viewOnGithub": "View on GitHub",

    // Shared modal chrome
    "modal.cancel": "Cancel",
    "modal.save": "Save",
    "modal.saving": "Saving...",
    "modal.done": "Done",
    "modal.unexpectedError": "Unexpected error while saving.",

    // EditOverviewModal
    "modal.overview.ariaEdit": "Edit overview",
    "modal.overview.title": "Edit overview",
    "modal.overview.placeholder": "Write a short professional summary...",
    "modal.overview.characters": "{n} characters",

    // EditEmailModal
    "modal.email.ariaEdit": "Edit email",
    "modal.email.title": "Edit email",
    "modal.email.invalid": "Invalid email",
    "modal.email.saveError": "Couldn't save, try again",
    "modal.email.hint": "shown on your public profile and CV",

    // EditExperiencesModal
    "modal.experiences.ariaEdit": "Edit experiences",
    "modal.experiences.title": "Edit experiences",
    "modal.experiences.ariaRemove": "Remove experience",
    "modal.experiences.jobTitle": "Job title",
    "modal.experiences.jobTitlePlaceholder": "E.g. Development Intern",
    "modal.experiences.company": "Company",
    "modal.experiences.companyPlaceholder": "E.g. Company X",
    "modal.experiences.start": "Start",
    "modal.experiences.end": "End",
    "modal.experiences.year": "Year",
    "modal.experiences.current": "Current (present job)",
    "modal.experiences.whatYouDid": "What you did (one line per bullet)",
    "modal.experiences.bulletsPlaceholder":
      "Developed internal software used by engineering and operations teams.\nBuilt REST APIs and backend services.\nWorked with PostgreSQL and SQL Server.",
    "modal.experiences.addEntry": "+ add experience",

    // EditStacksModal
    "modal.stacks.ariaEdit": "Edit stacks",
    "modal.stacks.title": "Edit stacks",
    "modal.stacks.placeholder": "E.g. TypeScript, Docker, PostgreSQL...",
    "modal.stacks.add": "+ add",
    "modal.stacks.empty": "no stacks yet.",
    "modal.stacks.ariaRemove": "Remove {name}",

    // EditCertificationsModal
    "modal.certifications.ariaEdit": "Edit certifications",
    "modal.certifications.title": "Edit certifications",
    "modal.certifications.ariaRemove": "Remove certification",
    "modal.certifications.name": "Certification name",
    "modal.certifications.namePlaceholder": "E.g. AWS Certified Cloud Practitioner",
    "modal.certifications.issuer": "Company / institution",
    "modal.certifications.issuerPlaceholder": "E.g. Amazon Web Services",
    "modal.certifications.issuedOn": "Issued on",
    "modal.certifications.expiration": "Expiration",
    "modal.certifications.hasExpiration": "Has an expiration date",
    "modal.certifications.addEntry": "+ add certification",

    // EditLanguagesModal
    "modal.languages.ariaEdit": "Edit languages",
    "modal.languages.title": "Edit languages",
    "modal.languages.ariaRemove": "Remove language",
    "modal.languages.addEntry": "+ add language",

    // EditProjectsModal
    "modal.projects.ariaEdit": "Edit projects",
    "modal.projects.title": "Edit projects",
    "modal.projects.syncing": "syncing with github...",
    "modal.projects.syncError": "couldn't refresh from github right now, showing the last saved version.",
    "modal.projects.noRepos": "no repositories found.",

    // DeleteAccountButton
    "deleteAccount.button": "Delete account",
    "deleteAccount.title": "Delete account",
    "deleteAccount.description":
      "This permanently deletes your Folio profile and all its data. This can't be undone.",
    "deleteAccount.deleting": "Deleting...",

    // SignOutButton
    "signOut.button": "Logout",

    // ConnectLinkedInButton
    "linkedin.import": "import from LinkedIn",
    "linkedin.comingSoon": "coming soon — for now, edit manually",

    // DownloadCvButton
    "downloadCv.generating": "Generating…",
    "downloadCv.viewCv": "View CV",

    // ShareButton
    "share.copied": "Link copied ✓",
    "share.button": "Share",
    "share.text": "Check out {name}'s professional profile on folio",
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
    "search.notFound": "Esse username ainda não está no Folio.",

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
    "login.error.authFailed": "O login com o GitHub não foi concluído. Tente de novo.",
    "login.error.profileSaveFailed": "Login feito, mas não foi possível salvar seu perfil. Tente de novo.",

    // Fallback surfaces (404 / error boundary)
    "notFound.title": "Essa página não existe.",
    "notFound.hint": "Procurando alguém? Busque pelo username do GitHub:",
    "notFound.goHome": "← Voltar para a home",
    "error.title": "Algo deu errado do nosso lado.",
    "error.retry": "Tentar novamente",

    // Connect / onboarding
    "connect.step.connecting": "conectando à api do github",
    "connect.step.reading": "lendo repositórios públicos",
    "connect.step.analyzing": "analisando linguagens e stacks",
    "connect.step.calculating": "calculando impacto por projeto",
    "connect.error.title": "Não foi possível sincronizar com o GitHub agora. Tentar de novo?",
    "connect.error.rateLimit":
      "O GitHub está limitando as requisições no momento. Aguarde um minuto e tente de novo.",
    "connect.error.auth": "Sua sessão com o GitHub precisa ser renovada para continuar.",
    "connect.error.tryAgain": "Tentar novamente",
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
    "connect.select.saveFailed": "Não foi possível salvar seu onboarding. Tente gerar de novo.",

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

    // Docs landing page
    "docs.title": "Documentação",
    "docs.subtitle": "Tudo que você precisa saber sobre como o Folio transforma seu GitHub",
    "docs.subtitleLine2": "em um portfólio e currículo.",
    "docs.readDocs": "Ler a documentação",
    "docs.viewOnGithub": "Ver no GitHub",

    // Shared modal chrome
    "modal.cancel": "Cancelar",
    "modal.save": "Salvar",
    "modal.saving": "Salvando...",
    "modal.done": "Concluído",
    "modal.unexpectedError": "Erro inesperado ao salvar.",

    // EditOverviewModal
    "modal.overview.ariaEdit": "Editar resumo",
    "modal.overview.title": "Editar resumo",
    "modal.overview.placeholder": "Escreva um resumo profissional curto...",
    "modal.overview.characters": "{n} caracteres",

    // EditEmailModal
    "modal.email.ariaEdit": "Editar e-mail",
    "modal.email.title": "Editar e-mail",
    "modal.email.invalid": "E-mail inválido",
    "modal.email.saveError": "Não foi possível salvar, tente de novo",
    "modal.email.hint": "exibido no seu perfil público e currículo",

    // EditExperiencesModal
    "modal.experiences.ariaEdit": "Editar experiências",
    "modal.experiences.title": "Editar experiências",
    "modal.experiences.ariaRemove": "Remover experiência",
    "modal.experiences.jobTitle": "Cargo",
    "modal.experiences.jobTitlePlaceholder": "Ex: Estagiário de Desenvolvimento",
    "modal.experiences.company": "Empresa",
    "modal.experiences.companyPlaceholder": "Ex: Empresa X",
    "modal.experiences.start": "Início",
    "modal.experiences.end": "Fim",
    "modal.experiences.year": "Ano",
    "modal.experiences.current": "Atual (emprego presente)",
    "modal.experiences.whatYouDid": "O que você fez (uma linha por tópico)",
    "modal.experiences.bulletsPlaceholder":
      "Desenvolveu software interno usado pelas equipes de engenharia e operações.\nConstruiu APIs REST e serviços de backend.\nTrabalhou com PostgreSQL e SQL Server.",
    "modal.experiences.addEntry": "+ adicionar experiência",

    // EditStacksModal
    "modal.stacks.ariaEdit": "Editar stacks",
    "modal.stacks.title": "Editar stacks",
    "modal.stacks.placeholder": "Ex: TypeScript, Docker, PostgreSQL...",
    "modal.stacks.add": "+ adicionar",
    "modal.stacks.empty": "nenhuma stack ainda.",
    "modal.stacks.ariaRemove": "Remover {name}",

    // EditCertificationsModal
    "modal.certifications.ariaEdit": "Editar certificações",
    "modal.certifications.title": "Editar certificações",
    "modal.certifications.ariaRemove": "Remover certificação",
    "modal.certifications.name": "Nome da certificação",
    "modal.certifications.namePlaceholder": "Ex: AWS Certified Cloud Practitioner",
    "modal.certifications.issuer": "Empresa / instituição",
    "modal.certifications.issuerPlaceholder": "Ex: Amazon Web Services",
    "modal.certifications.issuedOn": "Emitido em",
    "modal.certifications.expiration": "Expiração",
    "modal.certifications.hasExpiration": "Tem data de expiração",
    "modal.certifications.addEntry": "+ adicionar certificação",

    // EditLanguagesModal
    "modal.languages.ariaEdit": "Editar idiomas",
    "modal.languages.title": "Editar idiomas",
    "modal.languages.ariaRemove": "Remover idioma",
    "modal.languages.addEntry": "+ adicionar idioma",

    // EditProjectsModal
    "modal.projects.ariaEdit": "Editar projetos",
    "modal.projects.title": "Editar projetos",
    "modal.projects.syncing": "sincronizando com o github...",
    "modal.projects.syncError": "não foi possível atualizar com o github agora, mostrando a última versão salva.",
    "modal.projects.noRepos": "nenhum repositório encontrado.",

    // DeleteAccountButton
    "deleteAccount.button": "Excluir conta",
    "deleteAccount.title": "Excluir conta",
    "deleteAccount.description":
      "Isso exclui permanentemente seu perfil no Folio e todos os seus dados. Essa ação não pode ser desfeita.",
    "deleteAccount.deleting": "Excluindo...",

    // SignOutButton
    "signOut.button": "Sair",

    // ConnectLinkedInButton
    "linkedin.import": "importar do LinkedIn",
    "linkedin.comingSoon": "em breve — por enquanto, edite manualmente",

    // DownloadCvButton
    "downloadCv.generating": "Gerando…",
    "downloadCv.viewCv": "Ver Currículo",

    // ShareButton
    "share.copied": "Link copiado ✓",
    "share.button": "Compartilhar",
    "share.text": "Confira o perfil profissional de {name} no folio",
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
