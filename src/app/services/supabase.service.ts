import { Injectable, signal } from '@angular/core';
import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../models/database.types';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly session = signal<Session | null>(null);
  readonly configError = signal<string | null>(null);
  private supabase: SupabaseClient<Database> | null = null;

  get configured(): boolean {
    return this.supabase !== null;
  }

  get client(): SupabaseClient<Database> {
    if (!this.supabase) {
      throw new Error('O Supabase ainda não está configurado.');
    }
    return this.supabase;
  }

  async initialize(): Promise<void> {
    let config: unknown;
    try {
      const response = await fetch('/supabase-config.json');
      if (!response.ok) {
        throw new Error(`Resposta HTTP ${response.status}`);
      }
      config = await response.json();
    } catch (error) {
      this.configError.set(
        `Não foi possível carregar a configuração do Supabase. ${this.errorMessage(error)}`
      );
      return;
    }

    if (!isSupabaseConfig(config) || !config.url || !config.anonKey) {
      this.configError.set('Configure SUPABASE_URL e SUPABASE_ANON_KEY no ambiente de build.');
      return;
    }

    try {
      const url = new URL(config.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('A URL precisa usar HTTP ou HTTPS.');
      }
      this.supabase = createClient<Database>(config.url, config.anonKey);
      const { data, error } = await this.supabase.auth.getSession();
      if (error) {
        throw error;
      }
      this.session.set(data.session);
    } catch (error) {
      this.configError.set(`Não foi possível iniciar a conexão: ${this.errorMessage(error)}`);
      this.supabase = null;
    }
    if (this.supabase) {
      this.supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));
    }
  }

  async entrar(email: string, senha: string): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
  }

  async cadastrar(email: string, senha: string): Promise<boolean> {
    const { data, error } = await this.client.auth.signUp({ email, password: senha });
    if (error) throw error;
    return data.session !== null;
  }

  async sair(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

function isSupabaseConfig(value: unknown): value is SupabaseConfig {
  return value !== null
    && typeof value === 'object'
    && 'url' in value
    && typeof value.url === 'string'
    && 'anonKey' in value
    && typeof value.anonKey === 'string';
}
