// Placeholder admin pages for existing content types

export function AdminLexicon() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sanskrit Lexicon</h2>
        <p className="text-muted-foreground">Manage Sanskrit words and meanings</p>
      </div>
      <div className="border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground mb-4">Lexicon management interface coming soon</p>
        <p className="text-sm text-muted-foreground">Words are currently managed via the ingestion script</p>
      </div>
    </div>
  );
}

export function AdminBabyNames() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Baby Names</h2>
        <p className="text-muted-foreground">Review and approve baby names</p>
      </div>
      <div className="border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground mb-4">Baby names management interface coming soon</p>
        <p className="text-sm text-muted-foreground">Names are currently auto-generated via Gemini AI</p>
      </div>
    </div>
  );
}

export function AdminDailyWords() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Daily Words Schedule</h2>
        <p className="text-muted-foreground">Manage the word of the day rotation</p>
      </div>
      <div className="border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground mb-4">Daily word scheduling interface coming soon</p>
        <p className="text-sm text-muted-foreground">Words are currently auto-selected from unused lexemes</p>
      </div>
    </div>
  );
}

export function AdminUsers() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-muted-foreground">View users and activity</p>
      </div>
      <div className="border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground mb-4">User management interface coming soon</p>
        <p className="text-sm text-muted-foreground">View user details, learning progress, and grant admin access</p>
      </div>
    </div>
  );
}

export function AdminTranslations() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Translations</h2>
        <p className="text-muted-foreground">Manage UI translations</p>
      </div>
      <div className="border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground mb-4">Translation management interface coming soon</p>
        <p className="text-sm text-muted-foreground">Translations are currently auto-generated for Hindi and Spanish</p>
      </div>
    </div>
  );
}
