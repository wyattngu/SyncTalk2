"""
Seed script — populates the SyncTalk database with a rich demo dataset:
  - 21 users (incl. SyncBot) with diverse online status + bios
  - 6 tags
  - ~21 threads spanning all tags (markdown, code blocks, tables, mentions)
  - ~50 replies (some with @mentions to exercise mention notifications)
  - ~80 likes
  - ~120 reactions (6 emojis spread across threads + replies)
  - DM history between several pairs (incl. SyncBot)
  - 14 friendship rows covering ACCEPTED + PENDING (incoming + outgoing
    for the demo "alice" account) + DECLINED — exercises every state
    the FE FriendActionButton can render.

Run from the backend/ directory:

    ./venv/bin/python seed.py

Idempotent — re-running is safe; existing rows are reused or skipped.
"""

import sys
import random
from datetime import datetime, timezone, timedelta

from app import db, bcrypt
from app.models import (
    User, Thread, Reply, Like, Tag, ThreadTag,
    Message, Notification, Reaction,
    Friendship, FriendshipStatus,
)


DEMO_PASSWORD = "Password123!"

DEMO_USERS = [
    {"username": "alice",    "email": "alice@synctalk.dev",    "is_online": True,  "bio": "Full-stack engineer, open-source enthusiast"},
        {"username": "bob",      "email": "bob@synctalk.dev",      "is_online": True,  "bio": "Builds dev tools"},
    {"username": "charlie",  "email": "charlie@synctalk.dev",  "is_online": False, "bio": "Game developer"},
    {"username": "diana",    "email": "diana@synctalk.dev",    "is_online": True,  "bio": "Designer / illustrator"},
    {"username": "ethan",    "email": "ethan@synctalk.dev",    "is_online": False, "bio": "AI/ML researcher"},
    {"username": "fiona",    "email": "fiona@synctalk.dev",    "is_online": True,  "bio": "DevOps engineer"},
    {"username": "george",   "email": "george@synctalk.dev",   "is_online": False, "bio": "Backend specialist"},
    {"username": "hannah",   "email": "hannah@synctalk.dev",   "is_online": True,  "bio": "Frontend & a11y"},
    {"username": "ivan",     "email": "ivan@synctalk.dev",     "is_online": False, "bio": "Music producer & coder"},
    {"username": "julia",    "email": "julia@synctalk.dev",    "is_online": True,  "bio": "Tech writer"},
    {"username": "kevin",    "email": "kevin@synctalk.dev",    "is_online": False, "bio": "Data engineer"},
    # Newly added — lifts the directory to 20 humans + 1 bot for richer demos
    {"username": "linh",     "email": "linh@synctalk.dev",     "is_online": True,  "bio": "Mobile dev, Flutter & Swift"},
    {"username": "mateus",   "email": "mateus@synctalk.dev",   "is_online": False, "bio": "QA automation, Playwright fan"},
    {"username": "nora",     "email": "nora@synctalk.dev",     "is_online": True,  "bio": "Security engineer (red team)"},
    {"username": "omar",     "email": "omar@synctalk.dev",     "is_online": False, "bio": "Site reliability + platform"},
    {"username": "priya",    "email": "priya@synctalk.dev",    "is_online": True,  "bio": "Product designer, motion enthusiast"},
    {"username": "quentin",  "email": "quentin@synctalk.dev",  "is_online": False, "bio": "Smart-contracts dev, Rust & Solidity"},
    {"username": "rosa",     "email": "rosa@synctalk.dev",     "is_online": True,  "bio": "Engineering manager, ex-IC"},
    {"username": "sam",      "email": "sam@synctalk.dev",      "is_online": True,  "bio": "Infra/Kubernetes, homelabber"},
    {"username": "tomas",    "email": "tomas@synctalk.dev",    "is_online": False, "bio": "Databases, query plans for breakfast"},
    {"username": "SyncBot",  "email": "syncbot@synctalk.dev",  "is_online": True,  "bio": "SyncTalk's AI assistant"},
]

TAGS = [
    ("Technology", "technology"),
    ("Design",     "design"),
    ("Gaming",     "gaming"),
    ("Music",      "music"),
    ("AI",         "ai"),
    ("Random",     "random"),
]

# Each thread: (title, content_with_markdown, tags[], author_username, pinned?)
THREADS = [
    (
        "Welcome to SyncTalk! Introduce yourself 👋",
        "Hey everyone! This is the **first thread** on SyncTalk. Drop a comment below telling us:\n\n"
        "- What you're working on\n"
        "- Which tags interest you\n"
        "- A fun fact about yourself\n\n"
        "Looking forward to meeting you all! 🚀",
        ["random"], "alice", True,
    ),
    (
        "Best VS Code extensions in 2026?",
        "I've been deep-diving into productivity tooling lately. What can't you live without?\n\n"
        "My current top 5:\n"
        "1. **GitLens** — inline blame is a superpower\n"
        "2. **Error Lens** — way better than the problems panel\n"
        "3. **Path Intellisense** — autocomplete for file paths\n"
        "4. **Pretty TypeScript Errors** — humanises TS error spew\n"
        "5. **vscode-icons** — visual file recognition\n\n"
        "What's on your list?",
        ["technology"], "bob", False,
    ),
    (
        "Figma vs Penpot — has anyone fully migrated?",
        "With Penpot getting impressively good (open source, self-hostable), I'm tempted to migrate our team off Figma.\n\n"
        "Concerns:\n"
        "- Component variants — does Penpot handle them gracefully?\n"
        "- Plugin ecosystem — much smaller, but is the gap shrinking?\n"
        "- Real-time collaboration — Penpot is _close_ but not quite as smooth\n\n"
        "Has anyone here actually shipped a real product on Penpot? Would love stories.",
        ["design"], "diana", False,
    ),
    (
        "Best co-op games to play with 4 friends?",
        "We're a group of 4 looking for something:\n"
        "- Casual but with progression\n"
        "- Crossplay (PC + PS5)\n"
        "- Not too punishing on bad nights\n\n"
        "Already played to death:\n"
        "- Deep Rock Galactic\n"
        "- Lethal Company\n"
        "- It Takes Two (only 2-player)\n\n"
        "Recommendations welcome! @ethan I know you have opinions.",
        ["gaming"], "charlie", False,
    ),
    (
        "Building a chatbot with Gemini — first impressions",
        "Spent the weekend wiring **Gemini 2.5 Flash** into a side project. Quick takeaways:\n\n"
        "### What works well\n"
        "- Function calling story is much better than expected\n"
        "- Structured output (`response_mime_type='application/json'`) just works\n"
        "- Latency is consistently < 2s for short prompts\n\n"
        "### Sample code\n"
        "```python\n"
        "import google.generativeai as genai\n"
        "genai.configure(api_key=API_KEY)\n"
        "model = genai.GenerativeModel('gemini-2.5-flash')\n"
        "response = model.generate_content(\n"
        "    'Summarize this thread in 3 bullets',\n"
        "    generation_config={'response_mime_type': 'application/json'},\n"
        ")\n"
        "print(response.text)\n"
        "```\n\n"
        "Anyone else building with the new SDK?",
        ["ai", "technology"], "ethan", False,
    ),
    (
        "Lo-fi playlists for late-night coding?",
        "Drop your favorite playlists below. Bonus points if it has:\n\n"
        "- Zero vocals\n"
        "- Chill drums\n"
        "- Free / no Spotify Premium needed\n\n"
        "I'll start: **ChilledCow**'s classic stream still works for me, even though it's been ages.",
        ["music"], "alice", False,
    ),
    (
        "Hot take: dark mode is overrated for reading long form",
        "Light mode with proper contrast and a slightly off-white background is **easier on my eyes** for long sessions.\n\n"
        "> Code is a different story — there I want a true dark theme.\n\n"
        "But for reading docs, threads, and PRs? Light all day.\n\n"
        "Fight me 😄",
        ["design", "random"], "diana", False,
    ),
    (
        "Postgres vs MySQL in 2026 — which would you pick today?",
        "If you were starting a new SaaS today, which would you reach for?\n\n"
        "| Aspect | Postgres | MySQL |\n"
        "|---|---|---|\n"
        "| JSON support | First-class (jsonb) | Decent |\n"
        "| Extensions | Huge (pgvector, PostGIS) | Limited |\n"
        "| Replication | Logical + physical | Strong |\n"
        "| Tooling | psql, pgAdmin | Workbench |\n\n"
        "I lean Postgres for almost any new project. Convince me otherwise?",
        ["technology"], "george", False,
    ),
    (
        "Accessibility checklist before shipping any UI",
        "Hot from a recent audit. Save this checklist:\n\n"
        "- [ ] Every interactive element reachable via keyboard\n"
        "- [ ] Visible focus ring (don't `outline: none` without replacement)\n"
        "- [ ] Color contrast >= 4.5:1 for body text\n"
        "- [ ] Form inputs have associated `<label>`\n"
        "- [ ] Images have meaningful `alt` text (or `alt=\"\"` if decorative)\n"
        "- [ ] Page works at 200% zoom\n"
        "- [ ] Screen reader announces state changes (live regions)\n\n"
        "What am I missing? @fiona @bob",
        ["design", "technology"], "hannah", False,
    ),
    (
        "Gemini 2.5 Flash vs GPT-4o-mini for latency-sensitive apps",
        "Did some informal benchmarking on a chatbot use case:\n\n"
        "- **Gemini 2.5 Flash**: ~900ms p50, ~2s p99\n"
        "- **GPT-4o-mini**: ~700ms p50, ~1.6s p99\n\n"
        "Both produced comparable answer quality on technical Q&A. Gemini's free tier is generous though, which tips it for hobby projects.\n\n"
        "What's your experience with cold-start variance?",
        ["ai"], "ethan", False,
    ),
    (
        "Synthwave Friday — share your latest finds",
        "It's Friday! Drop a synthwave/retrowave track that's been on repeat this week.\n\n"
        "I'll start: **The Midnight - Sunset** never gets old.",
        ["music", "random"], "ivan", False,
    ),
    (
        "Best practices for migrations on a high-traffic Postgres DB",
        "Recently shipped a `NOT NULL` add to a 50M-row table. Lessons learned:\n\n"
        "1. **Add column NULLABLE first** with a default — atomic, fast\n"
        "2. **Backfill in batches** — `UPDATE ... WHERE id BETWEEN x AND y`\n"
        "3. **Add NOT NULL constraint AS NOT VALID**, then `VALIDATE` separately\n"
        "4. **Monitor lock waits** — `pg_stat_activity` is your friend\n\n"
        "What other patterns have saved your bacon?",
        ["technology"], "kevin", False,
    ),
    (
        "How do you stay focused while coding from home?",
        "Looking for tips beyond the obvious (Pomodoro, no Slack, etc.). What actually works for you?\n\n"
        "Things I've tried:\n"
        "- Lo-fi music — works for shallow tasks, fails for deep thinking\n"
        "- Time-boxing — helps but I cheat\n"
        "- Standing desk — surprisingly effective\n\n"
        "What's your setup?",
        ["random"], "julia", False,
    ),
    (
        "Soulslike recommendations for a beginner?",
        "Never played one. Where should I start in 2026?\n\n"
        "Heard great things about **Lies of P** and **Elden Ring** but worried I'll bounce off the difficulty curve.",
        ["gaming"], "charlie", False,
    ),
    (
        "Tailwind v4 — what's actually new and useful?",
        "After a week of using Tailwind v4, my honest takes:\n\n"
        "✅ **CSS variable-driven theming** is gorgeous — `@theme inline`\n"
        "✅ **Faster builds** with Oxide engine\n"
        "✅ **Native cascade layers** simplify overrides\n"
        "⚠️ **Breaking changes** in default colors mean migration takes a day\n"
        "❌ **`@apply` in Lightning CSS** had quirks early on (mostly fixed now)\n\n"
        "Verdict: worth migrating new projects. Old ones — wait.\n\n"
        "Source: [tailwindcss.com/blog](https://tailwindcss.com/blog/tailwindcss-v4)",
        ["technology", "design"], "hannah", False,
    ),
    (
        "What's a small refactor that drastically improved your codebase?",
        "Looking for inspiration. The smaller the change, the better.\n\n"
        "Mine: replacing a 300-line god-component with a `useFooData` hook + 3 tiny presentational components. Not novel, but compounded across the codebase it's been transformative.",
        ["technology"], "bob", False,
    ),
]

# Each reply: (thread_title_fragment, author_username, content)
REPLIES = [
    # Welcome thread
    ("Welcome", "bob",     "Hey! Bob here, building dev tools."),
    ("Welcome", "charlie", "Hi all 👋 mostly into gamedev."),
    ("Welcome", "diana",   "Designer / illustrator, glad to be here."),
    ("Welcome", "fiona",   "DevOps + homelab person, happy to chat about CI/CD."),
    ("Welcome", "julia",   "Tech writer here. If you need someone to proofread docs, ping me!"),
    ("Welcome", "ivan",    "Music producer who codes synth plugins on the side 🎹"),
    # VS Code thread
    ("VS Code", "alice",   "Once you see GitLens inline blame you can't go back."),
    ("VS Code", "diana",   "Error Lens. Way better than squinting at the problems panel."),
    ("VS Code", "hannah",  "**Pretty TypeScript Errors** — game changer for unreadable TS unions."),
    ("VS Code", "george",  "Adding `Code Spell Checker` — catches typos in commit messages too."),
    # Figma thread
    ("Figma",   "alice",   "Tried Penpot for a small project — surprisingly close, but variants were rough at the time."),
    ("Figma",   "hannah",  "We migrated half our team. Real-time collab is the only friction left."),
    # Co-op games
    ("co-op",   "ethan",   "**Helldivers 2** if you want chaos. Otherwise Risk of Rain 2."),
    ("co-op",   "ivan",    "@charlie try Vermintide 2 — lovely 4-player coop."),
    # Gemini thread
    ("Gemini",  "alice",   "How's the latency feel compared to Claude?"),
    ("Gemini",  "bob",     "Function calling docs are actually decent now."),
    ("Gemini",  "kevin",   "Beware rate limits on the free tier when you batch — got bitten last week."),
    ("Gemini",  "ethan",   "@kevin yeah, exponential backoff is mandatory."),
    # Lo-fi
    ("lo-fi",   "ethan",   "ChilledCow's classic stream still works for me."),
    ("lo-fi",   "ivan",    "I made a 2-hour playlist if anyone wants the link in DM."),
    # dark mode
    ("dark mode", "bob",   "Hard agree on long-form. Code is a different story."),
    ("dark mode", "fiona", "Counterpoint: light mode wrecks me past midnight 😅"),
    # Postgres vs MySQL
    ("Postgres vs MySQL", "alice",  "Postgres for the `jsonb` story alone."),
    ("Postgres vs MySQL", "ethan",  "pgvector is the killer extension for AI features."),
    ("Postgres vs MySQL", "kevin",  "MySQL still wins on simple replication ops, IMO."),
    # Accessibility
    ("Accessibility", "fiona", "Don't forget reduced-motion preferences. `prefers-reduced-motion` should disable big animations."),
    ("Accessibility", "bob",   "Skip-to-content links are easy and so often missed."),
    ("Accessibility", "diana", "Ensure focus order matches visual order — RTL languages especially."),
    # Gemini vs GPT
    ("Gemini 2.5 Flash vs GPT", "alice",  "Cold start on Gemini is more variable in my testing."),
    ("Gemini 2.5 Flash vs GPT", "george", "Anyone benchmarked Claude Haiku alongside? Curious where it lands."),
    # Synthwave Friday
    ("Synthwave", "ethan",  "**FM-84 - Running In The Night** — a classic."),
    ("Synthwave", "alice",  "Nice. Adding to my Monday playlist."),
    # Migrations
    ("migrations", "alice",  "Online schema change tools (gh-ost, pt-online-schema-change) saved us."),
    ("migrations", "fiona",  "Always test the rollback path locally first."),
    # Focus while coding
    ("focused", "alice",   "Two-monitor setup with Slack + browser hidden on monitor 2."),
    ("focused", "diana",   "Noise-cancelling headphones with the music OFF. Just silence."),
    ("focused", "bob",     "Brown noise + 25/5 timeboxes. Game changer."),
    # Soulslike
    ("Soulslike", "ivan",  "Start with **Lies of P** — most beginner-friendly Souls in years."),
    ("Soulslike", "ethan", "Or Star Wars Jedi: Survivor — Souls-lite with story."),
    # Tailwind
    ("Tailwind v4", "bob", "The migration script handled 90% of our codebase. Last 10% was tricky color overrides."),
    ("Tailwind v4", "alice", "I love the new `@theme inline` block. Theming is now actually pleasant."),
    # Refactor inspiration
    ("refactor", "diana", "Pulling all `axios.get` calls into a typed `services/` layer. So much cleaner."),
    ("refactor", "fiona", "Moving env-dependent constants into a single `config.ts`. Bye ad-hoc `process.env` calls."),
    ("refactor", "ethan", "Splitting one 700-line useEffect into 4 named ones with clear deps."),
]


# Reactions to seed: (thread_title_fragment, target_type, emoji, user_usernames)
REACTIONS_SEED = [
    ("Welcome",                  "thread", "👍", ["bob", "charlie", "diana", "fiona", "ethan"]),
    ("Welcome",                  "thread", "🎉", ["alice", "hannah", "ivan"]),
    ("VS Code",                  "thread", "👍", ["alice", "diana", "ethan", "fiona"]),
    ("VS Code",                  "thread", "🚀", ["hannah", "george"]),
    ("Gemini",                   "thread", "🤔", ["bob", "alice"]),
    ("Gemini",                   "thread", "👍", ["fiona", "kevin"]),
    ("Postgres vs MySQL",        "thread", "👍", ["alice", "ethan", "fiona"]),
    ("Postgres vs MySQL",        "thread", "🚀", ["kevin"]),
    ("Accessibility",            "thread", "❤️", ["bob", "diana", "alice"]),
    ("Accessibility",            "thread", "👍", ["fiona", "hannah"]),
    ("Tailwind",                 "thread", "🎉", ["alice", "bob"]),
    ("Tailwind",                 "thread", "👍", ["diana"]),
    ("dark mode",                "thread", "🤔", ["alice", "fiona", "kevin"]),
    ("Soulslike",                "thread", "😄", ["ivan", "ethan"]),
    ("Synthwave",                "thread", "❤️", ["alice", "diana"]),
    ("co-op",                    "thread", "🎮", []),  # filtered out — invalid emoji, just to test resilience
    ("co-op",                    "thread", "👍", ["alice", "ivan", "fiona"]),
    ("focused",                  "thread", "🤔", ["alice", "diana", "ivan"]),
]

# DM history pairs and content (sender, receiver, content)
DM_HISTORY = [
    ("alice", "bob",     "Hey Bob, free for a quick sync today?"),
    ("bob",   "alice",   "Yep — 3pm works."),
    ("alice", "bob",     "Perfect, I'll send the link."),
    ("alice", "SyncBot", "Summarize my open threads please."),
    ("SyncBot", "alice", "Sure! Here's a quick summary of your open threads…"),
    ("alice", "diana",   "Did you see the new Tailwind v4 thread? Curious what you think."),
    ("diana", "alice",   "Yes! Migrating our design system this week."),
    ("ethan", "bob",     "Thinking of a benchmark post on Claude Haiku — interested?"),
    ("bob",   "ethan",   "Always interested. Send me the draft when ready."),
    ("hannah", "fiona",  "Got time to pair on the a11y audit Thursday?"),
    ("fiona", "hannah",  "Thursday afternoon works. I'll bring the screen reader."),
    # Newly added — exercise more avatar variety and unread badges
    ("linh",  "alice",   "Saw your refactor thread — exactly what we needed last sprint."),
    ("alice", "linh",    "Glad it landed! Happy to chat about how we split the hooks."),
    ("nora",  "fiona",   "Heads up — found an open S3 bucket on the staging stack."),
    ("priya", "diana",   "Mood-board ready when you have 5 min 🎨"),
    ("sam",   "omar",    "K8s control plane is acting up again. Mind looking?"),
]


# Friendships to seed.
#
# Each tuple: (requester_username, addressee_username, status)
#   status ∈ {"accepted", "pending", "declined"}
#
# This deliberately covers every state the FE FriendActionButton can render.
# Using "alice" as the demo viewer:
#   - accepted with bob, diana, fiona, hannah, linh   → "Friends"
#   - pending OUT to ethan, priya                     → "Cancel request"
#   - pending IN  from charlie, sam                   → "Accept | Decline"
#   - declined with mateus                            → "Add friend" (resettable)
# Plus 4 more accepted/pending pairs between OTHER users so the friend
# counts on their public profiles aren't all zero.
FRIENDSHIPS = [
    # alice — accepted (her main circle)
    ("alice", "bob",     "accepted"),
    ("alice", "diana",   "accepted"),
    ("alice", "fiona",   "accepted"),
    ("alice", "hannah",  "accepted"),
    ("alice", "linh",    "accepted"),
    # alice — pending OUT (she sent them, awaiting response)
    ("alice", "ethan",   "pending"),
    ("alice", "priya",   "pending"),
    # alice — pending IN (others sent to her, awaiting her response)
    ("charlie", "alice", "pending"),
    ("sam",     "alice", "pending"),
    # alice — declined (she rejected mateus previously; he can re-send)
    ("mateus", "alice",  "declined"),
    # Cross-pairs so other users have non-zero friend counts on their profiles
    ("bob",    "diana",  "accepted"),
    ("hannah", "fiona",  "accepted"),
    ("nora",   "omar",   "accepted"),
    ("priya",  "diana",  "pending"),
]


# ─── Helpers ─────────────────────────────────────────────────────────────

def get_or_create_user(username, email, is_online, bio=None):
    user = User.query.filter_by(email=email).first()
    if user:
        return user
    user = User(
        username=username,
        email=email,
        password_hash=bcrypt.generate_password_hash(DEMO_PASSWORD).decode("utf-8"),
        is_online=is_online,
        created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(5, 90)),
        last_seen=datetime.now(timezone.utc) - timedelta(minutes=random.randint(0, 480)),
    )
    db.session.add(user)
    db.session.flush()
    return user


def get_or_create_tag(name, slug):
    tag = Tag.query.filter_by(slug=slug).first()
    if tag:
        return tag
    tag = Tag(name=name, slug=slug)
    db.session.add(tag)
    db.session.flush()
    return tag


def find_thread_like(fragment):
    return Thread.query.filter(Thread.title.ilike(f"%{fragment}%")).first()


def main(app=None):
    if app is None:
        from app import create_app
        app = create_app()
    with app.app_context():
        # ── Users ────────────────────────────────────────────────────────
        print("→ Seeding users...")
        users = {u["username"]: get_or_create_user(
            u["username"], u["email"], u["is_online"]
        ) for u in DEMO_USERS}

        # ── Tags ─────────────────────────────────────────────────────────
        print("→ Seeding tags...")
        tags_by_slug = {slug: get_or_create_tag(name, slug) for name, slug in TAGS}

        # ── Threads ──────────────────────────────────────────────────────
        print(f"→ Seeding threads ({len(THREADS)})...")
        for title, content, tag_slugs, author_username, pinned in THREADS:
            existing = Thread.query.filter_by(title=title).first()
            if existing:
                continue
            author = users[author_username]
            thread = Thread(
                title=title,
                content=content,
                author_id=author.id,
                is_pinned=pinned,
                created_at=datetime.now(timezone.utc) - timedelta(
                    hours=random.randint(2, 240)
                ),
            )
            db.session.add(thread)
            db.session.flush()
            for slug in tag_slugs:
                tag = tags_by_slug[slug]
                db.session.add(ThreadTag(thread_id=thread.id, tag_id=tag.id))

        db.session.flush()

        # ── Replies (with mention notifications fired automatically through service) ─
        print(f"→ Seeding replies ({len(REPLIES)})...")
        from app.services.thread_service import ThreadService
        thread_service = ThreadService()

        for fragment, author_name, content in REPLIES:
            thread = find_thread_like(fragment)
            if not thread:
                continue
            author = users[author_name]
            already = Reply.query.filter_by(
                thread_id=thread.id, author_id=author.id, content=content
            ).first()
            if already:
                continue
            # Use service so @mentions trigger notification creation just like real flow
            reply, _ = thread_service.create_reply(thread.id, author.id, content)
            if reply:
                # Adjust created_at backwards so it sits inside thread timeframe
                reply.created_at = thread.created_at + timedelta(
                    minutes=random.randint(5, 1200)
                )

        # ── Likes ─────────────────────────────────────────────────────────
        print("→ Seeding likes...")
        for thread in Thread.query.all():
            existing_likes = {l.user_id for l in thread.likes}
            for u in users.values():
                if u.id in existing_likes:
                    continue
                if random.random() < 0.45:
                    db.session.add(Like(user_id=u.id, thread_id=thread.id))
                    thread.like_count = (thread.like_count or 0) + 1

        # ── Reactions ─────────────────────────────────────────────────────
        print("→ Seeding reactions...")
        ALLOWED = {"👍", "❤️", "🎉", "🤔", "😄", "🚀"}
        seeded_reactions = 0
        for fragment, target_type, emoji, usernames in REACTIONS_SEED:
            if emoji not in ALLOWED:
                continue
            thread = find_thread_like(fragment)
            if not thread:
                continue
            target_id = thread.id  # only seeding thread-level reactions for now
            for uname in usernames:
                user = users.get(uname)
                if not user:
                    continue
                existing = Reaction.query.filter_by(
                    user_id=user.id,
                    target_type=target_type,
                    target_id=target_id,
                    emoji=emoji,
                ).first()
                if existing:
                    continue
                db.session.add(Reaction(
                    user_id=user.id,
                    target_type=target_type,
                    target_id=target_id,
                    emoji=emoji,
                ))
                seeded_reactions += 1

        # Sprinkle some reactions on the most-replied threads' replies too
        top_threads = (
            Thread.query.order_by(Thread.reply_count.desc()).limit(4).all()
        )
        for thread in top_threads:
            for reply in Reply.query.filter_by(thread_id=thread.id).limit(3).all():
                emoji = random.choice(list(ALLOWED))
                voters = random.sample(list(users.values()), k=random.randint(1, 4))
                for u in voters:
                    if u.id == reply.author_id:
                        continue
                    exists = Reaction.query.filter_by(
                        user_id=u.id, target_type='reply',
                        target_id=reply.id, emoji=emoji,
                    ).first()
                    if exists:
                        continue
                    db.session.add(Reaction(
                        user_id=u.id, target_type='reply',
                        target_id=reply.id, emoji=emoji,
                    ))
                    seeded_reactions += 1

        # ── Direct messages ───────────────────────────────────────────────
        print("→ Seeding direct messages...")
        for sender_name, receiver_name, content in DM_HISTORY:
            sender = users[sender_name]
            receiver = users[receiver_name]
            already = Message.query.filter_by(
                sender_id=sender.id, receiver_id=receiver.id, content=content
            ).first()
            if already:
                continue
            db.session.add(Message(
                sender_id=sender.id,
                receiver_id=receiver.id,
                content=content,
                is_read=True,
                created_at=datetime.now(timezone.utc) - timedelta(
                    minutes=random.randint(5, 600)
                ),
            ))

        # ── Friendships ───────────────────────────────────────────────────
        # Use the service so accepted/pending requests fire the right
        # notifications, exactly like the live flow would.
        print(f"→ Seeding friendships ({len(FRIENDSHIPS)})...")
        from app.features.friends import FriendshipService
        friendship_service = FriendshipService()

        STATUS_MAP = {
            "pending":  FriendshipStatus.PENDING,
            "accepted": FriendshipStatus.ACCEPTED,
            "declined": FriendshipStatus.DECLINED,
        }

        for requester_name, addressee_name, status in FRIENDSHIPS:
            requester = users[requester_name]
            addressee = users[addressee_name]

            existing = Friendship.query.filter(
                ((Friendship.requester_id == requester.id) &
                 (Friendship.addressee_id == addressee.id)) |
                ((Friendship.requester_id == addressee.id) &
                 (Friendship.addressee_id == requester.id))
            ).first()
            if existing:
                continue

            friendship, error = friendship_service.send_request(
                requester.id, addressee.id
            )
            if error or not friendship:
                continue

            target_status = STATUS_MAP.get(status, FriendshipStatus.PENDING)
            if target_status == FriendshipStatus.ACCEPTED:
                friendship_service.accept_request(friendship.id, addressee.id)
            elif target_status == FriendshipStatus.DECLINED:
                friendship_service.decline_request(friendship.id, addressee.id)
            # PENDING — nothing more to do.

        db.session.commit()

        # ── Summary ───────────────────────────────────────────────────────
        print()
        print("✓ Seeding complete:")
        print(f"   {User.query.count():>4} users")
        print(f"   {Tag.query.count():>4} tags")
        print(f"   {Thread.query.count():>4} threads")
        print(f"   {Reply.query.count():>4} replies")
        print(f"   {Like.query.count():>4} likes")
        print(f"   {Reaction.query.count():>4} reactions")
        print(f"   {Message.query.count():>4} direct messages")
        print(f"   {Friendship.query.count():>4} friendships")
        print(f"   {Notification.query.count():>4} notifications (incl. auto-generated mentions + friend requests)")
        print()
        print("Login credentials (all users share the same password):")
        print(f"   password: {DEMO_PASSWORD}")
        print( "   emails  :")
        for u in DEMO_USERS:
            print(f"     - {u['email']:32s}  (username: {u['username']})")
        print()
        print("Friend-state demo (sign in as alice to see all states):")
        print("   • Friends:        bob, diana, fiona, hannah, linh")
        print("   • Sent (pending): ethan, priya")
        print("   • Incoming:       charlie, sam")
        print("   • Declined:       mateus  (will show 'Add friend' again)")


if __name__ == "__main__":
    sys.exit(main())
