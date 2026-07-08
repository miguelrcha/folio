"use client";

import { useEffect, useState } from "react";
import { MailIcon } from "@/components/MailIcon";

export function ProtectedEmailLink({
  encodedEmail,
  className,
}: {
  encodedEmail: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Decodificação tem que rodar só depois de montar no cliente — se
    // calculássemos isso direto no corpo do componente, o Next renderizaria o
    // e-mail já decodificado no HTML gerado no servidor, voltando a expor o
    // endereço em texto puro pra scrapers que não executam JS.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(atob(encodedEmail));
  }, [encodedEmail]);

  if (!email) {
    return (
      <span className={className}>
        <MailIcon className="h-4 w-4" />
      </span>
    );
  }

  return (
    <a href={`mailto:${email}`} className={className}>
      <MailIcon className="h-4 w-4" />
      {email}
    </a>
  );
}
