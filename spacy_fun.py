# Before running this, make sure to install spacy:
#
#     pip install spacy
#     python -m spacy download en_core_web_sm

from typing import Counter
import spacy

from ehpa_harassment_cases_stats import load_datafile, print_counters

nlp = spacy.load("en_core_web_sm")

cases = load_datafile()

noun_phrase_counters = Counter[str]()

verb_counters = Counter[str]()

for case in cases:
    details = case['harassment_details']
    doc = nlp(details)
    noun_phrases = [chunk.text.lower() for chunk in doc.noun_chunks]
    for np in noun_phrases:
        noun_phrase_counters[np] += 1
    verbs = [token.lemma_.lower() for token in doc if token.pos_ == "VERB"]
    for verb in verbs:
        verb_counters[verb] += 1

print(f"Most common noun phrases:\n\n")

print_counters(noun_phrase_counters, min_value=10)

print(f"\n\nMost common verbs:\n\n")

print_counters(verb_counters, min_value=10)
