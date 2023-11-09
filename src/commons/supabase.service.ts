import { Injectable } from '@nestjs/common';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
	private supabase: SupabaseClient;

	constructor() {
		this.supabase = createClient(
			`https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`,
			process.env.SUPABASE_ANON_KEY,
		);
	}
	getClient() {
		return this.supabase;
	}
}
