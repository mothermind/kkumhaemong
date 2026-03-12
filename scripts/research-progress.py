#!/usr/bin/env python3
"""Check research progress against the plan."""
import json, os

research_dir = '/Users/llnormll/WorkSpace/my-fortune-site/data/research'
plan_path = f'{research_dir}/_plan.json'

with open(plan_path, encoding='utf-8') as f:
    plan = json.load(f)

print(f"{'Category':<20} {'Done':>5} {'Total':>6}  Pending slugs")
print("-" * 80)

total_done = total_planned = 0
for cat, items in sorted(plan.items()):
    done = [i for i in items if os.path.exists(f"{research_dir}/{cat}/{i['slug']}.json")]
    pending = [i for i in items if not os.path.exists(f"{research_dir}/{cat}/{i['slug']}.json")]
    total_done += len(done)
    total_planned += len(items)
    pending_str = ', '.join(i['slug'] for i in pending) if pending else '✅ complete'
    print(f"{cat:<20} {len(done):>5} {len(items):>6}  {pending_str}")

print("-" * 80)
print(f"{'TOTAL':<20} {total_done:>5} {total_planned:>6}  ({total_planned-total_done} remaining)")
