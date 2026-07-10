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
    // Decoding has to run only after mounting on the client — if we
    // computed this directly in the component body, Next would render the
    // already-decoded email in the server-generated HTML, exposing the
    // plain-text address again to scrapers that don't execute JS.
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
