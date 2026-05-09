import Image from "next/image";

export function Logo() {
  return (
    <a href="/" className="logo" aria-label="Fanovera">
      <Image
        src="/fanovera-logo.png"
        alt="Fanovera"
        width={752}
        height={252}
        priority
        style={{ height: 36, width: "auto", display: "block" }}
      />
    </a>
  );
}
