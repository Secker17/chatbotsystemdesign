# Oppsett av Supabase

Denne guiden viser deg hvordan du konfigurerer Supabase for chatbot-systemet.

## Hva skjer når Supabase ikke er konfigurert?

Når `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_ANON_KEY` ikke er satt, vil applikasjonen kjøre i **development mode**:

- ✅ **Autentisering deaktivert** - Alle ruter er tilgjengelige
- ✅ **Database-funksjoner deaktivert** - Mock data returneres
- ✅ **UI fungerer fullt** - Du kan teste fargevelgeren og andre komponenter
- ⚠️ **Data lagres ikke** - Endringer blir ikke persistert

## 1. Opprett Supabase-prosjekt

1. Gå til [supabase.com](https://supabase.com)
2. Klikk "Start your project"
3. Logg inn med GitHub, Google eller e-post
4. Opprett nytt prosjekt:
   - **Organization**: Velg eller opprett ny
   - **Project Name**: F.eks "chatbot-system"
   - **Database Password**: Lag et sterkt passord
   - **Region**: Velg nærmeste region (f.eks. Europe)

## 2. Hent API-nøkler

Når prosjektet er opprettet:

1. Gå til Project Settings → API
2. Kopier følgende:
   ```
   Project URL: https://xxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 3. Konfigurer miljøvariabler

Opprett `.env.local` fil i rotmappen:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ditt-prosjekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_anon_key_her
SUPABASE_SERVICE_ROLE_KEY=din_service_role_key_her
```

**Viktig**: Bruk `.env.local` (ikke `.env`) for sikkerhets skyld.

## 4. Sett opp database-tabeller

Kjør SQL i Supabase SQL Editor:

```sql
-- Chatbot configurations
CREATE TABLE IF NOT EXISTS chatbot_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_title TEXT DEFAULT 'Chat with us',
  welcome_message TEXT DEFAULT 'Hi! How can we help you today?',
  primary_color TEXT DEFAULT '#14b8a6',
  position TEXT DEFAULT 'bottom-right',
  avatar_url TEXT,
  show_branding BOOLEAN DEFAULT true,
  offline_message TEXT DEFAULT 'We are currently offline. Leave a message!',
  placeholder_text TEXT DEFAULT 'Type your message...',
  launcher_text TEXT,
  launcher_text_enabled BOOLEAN DEFAULT false,
  business_hours_enabled BOOLEAN DEFAULT false,
  business_hours JSONB,
  business_hours_timezone TEXT,
  outside_hours_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE chatbot_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own configs
CREATE POLICY "Users can view own chatbot configs"
  ON chatbot_configs FOR SELECT
  USING (auth.uid() = admin_id);

CREATE POLICY "Users can update own chatbot configs"
  ON chatbot_configs FOR UPDATE
  USING (auth.uid() = admin_id);

CREATE POLICY "Users can insert own chatbot configs"
  ON chatbot_configs FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chatbot_configs_updated_at
  BEFORE UPDATE ON chatbot_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 5. Test konfigurasjonen

Restart utviklingsserveren:

```bash
npm run dev
```

Sjekk console for meldinger:
- ✅ "Supabase environment variables found. Authentication enabled."
- ❌ "Supabase environment variables not found. Authentication disabled."

## 6. Valgfrie oppsett

### Auth providers

I Supabase Authentication → Settings:

1. **GitHub OAuth**
   - Enabled: Toggle på
   - Client ID: Fra GitHub OAuth app
   - Client Secret: Fra GitHub OAuth app

2. **Google OAuth**
   - Enabled: Toggle på
   - Client ID: Fra Google Cloud Console
   - Client Secret: Fra Google Cloud Console

### Storage

For filopplasting (avatar bilder):

1. Gå til Storage
2. Opprett ny bucket: `avatars`
3. Sett up RLS policy:

```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Allow users to view their own avatars
CREATE POLICY "Users can view own avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
```

## Feilsøking

### "Authentication disabled" fortsatt?
1. Sjekk at `.env.local` eksisterer
2. Verifiser variabelnavn er korrekte
3. Restart serveren med `npm run dev`
4. Sjekk browser console for feilmeldinger

### Database-feil
1. Sjekk at SQL ble kjørt uten feil
2. Verifiser RLS policies er aktivert
3. Test med Supabase Table Editor

### CORS-feil
I Supabase Project Settings → API:

```json
{
  "allowedOrigins": ["http://localhost:3000", "https://ditt-domene.com"],
  "allowedHeaders": ["*"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"]
}
```

## Production deploy

For produksjon:

1. Sett miljøvariabler i hosting platform
2. Oppdater CORS med ditt domene
3. Kjør migrations i produksjonsdatabase
4. Test alle funksjoner

## Neste steg

Når Supabase er konfigurert:

1. [ ] Registrer første bruker
2. [ ] Test chatbot konfigurasjon
3. [ ] Verifiser fargevalg lagres
4. [ ] Test alle admin-funksjoner

Trenger du hjelp? Sjekk [Supabase dokumentasjonen](https://supabase.com/docs).
