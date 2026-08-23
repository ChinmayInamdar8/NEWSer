import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";
import { AuthService } from "./auth.service";
import { loadServerEnv, serverEnv } from "../load-env";

function googleEnv(name: string): string | undefined {
  const value = serverEnv[name] ?? process.env[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    loadServerEnv();

    const clientID = googleEnv("GOOGLE_CLIENT_ID");
    const clientSecret = googleEnv("GOOGLE_CLIENT_SECRET");
    const callbackURL = googleEnv("GOOGLE_CALLBACK_URL");

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        `Google OAuth is not configured (loaded keys: ${Object.keys(serverEnv).join(", ") || "none"}). Put GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in apps/server/.env and restart pnpm dev.`
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    });

    this.authService = authService;
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile
  ) {
    return this.authService.upsertGoogleUser(profile);
  }
}
