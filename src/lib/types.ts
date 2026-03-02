// e-Gov Law API v2 response types

export interface LawInfo {
  law_type: string;
  law_id: string;
  law_num: string;
  law_num_era: string;
  law_num_year: number;
  law_num_type: string;
  law_num_num: string;
  promulgation_date: string;
}

export interface RevisionInfo {
  law_revision_id: string;
  law_type: string;
  law_title: string;
  law_title_kana: string;
  abbrev: string | null;
  category: string;
  updated: string;
  amendment_promulgate_date: string;
  amendment_enforcement_date: string;
  amendment_enforcement_comment: string | null;
  amendment_scheduled_enforcement_date: string | null;
  amendment_law_id: string;
  amendment_law_title: string;
  amendment_law_title_kana: string | null;
  amendment_law_num: string;
  amendment_type: string;
  repeal_status: string;
  repeal_date: string | null;
  remain_in_force: boolean | null;
  mission: string;
  current_revision_status: string;
}

export interface LawSearchResult {
  total_count: number;
  count: number;
  next_offset: number;
  laws: Array<{
    law_info: LawInfo;
    revision_info: RevisionInfo;
    current_revision_info: RevisionInfo;
  }>;
}

// JSON tree node for law_full_text
export interface LawNode {
  tag: string;
  attr: Record<string, string>;
  children: Array<LawNode | string>;
}

export interface LawDataResult {
  attached_files_info: unknown;
  law_info: LawInfo;
  revision_info: RevisionInfo;
  law_full_text: LawNode;
}

export interface KeywordSentence {
  position: string;
  text: string;
}

export interface KeywordSearchResult {
  total_count: number;
  sentence_count: number;
  next_offset: number;
  items: Array<{
    law_info: LawInfo;
    revision_info: RevisionInfo;
    sentences: KeywordSentence[];
  }>;
}

export interface LawRevisionsResult {
  law_info: LawInfo;
  revisions: RevisionInfo[];
}
