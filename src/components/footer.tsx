export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-5xl px-6 py-6 text-center text-xs sm:text-sm text-muted-foreground">
        <p className="text-xs sm:text-sm">
          Powered by{" "}
          <a
            href="https://github.com/projectdiscovery/cvemap"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:text-primary/80 hover:underline"
          >
            ProjectDiscovery Vulnerability API
          </a>
          <span className="mx-1 text-muted-foreground/70">•</span>
          <a
            href="https://github.com/benjaminjost/vulnx-web"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:text-primary/80 hover:underline"
          >
            View Source on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
