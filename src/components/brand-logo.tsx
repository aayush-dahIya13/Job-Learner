import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
};

/** Shared official JOB-LEARNER vector mark. Its SVG source has a transparent background. */
export function BrandLogo({ href, compact = false, showTagline = true, className = "" }: BrandLogoProps) {
  const content = <>
    <span className={`brand-logo-image ${compact ? "brand-logo-image-compact" : ""}`}>
      <Image src="/assets/job-learner-logo.svg" alt="JOB-LEARNER JL monogram" width={compact ? 66 : 76} height={compact ? 66 : 76} priority className="h-full w-full object-contain" />
    </span>
    {!compact && <span className="brand-logo-copy"><b>JOB-LEARNER</b>{showTagline && <small>Career Intelligence</small>}</span>}
  </>;

  if (!href) return <span className={`brand-logo ${className}`}>{content}</span>;
  return <Link href={href} aria-label="JOB-LEARNER" className={`brand-logo ${className}`}>{content}</Link>;
}
