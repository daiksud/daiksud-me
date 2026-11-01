"""Keep setup notices separate from the evidence proving a clean Codex review."""

import copy
import unittest

import test_codex_approval as approval


ADVISORY = (
    "To use Codex here, [create an environment for this repo]"
    "(https://chatgpt.com/codex/cloud/settings/environments)."
)


def with_advisory():
    data = approval.fixture()
    data["comments"].append(approval.comment(5, ADVISORY, "2026-10-31T11:30:20Z"))
    return data


def with_prior_cycle():
    data = with_advisory()
    # A finished earlier request may also have received an informational notice.
    prior = copy.deepcopy(data["comments"])
    for item in prior:
        item["id"] -= 10
        item["created_at"] = item["created_at"].replace("T11:", "T10:")
        item["updated_at"] = item["updated_at"].replace("T11:", "T10:")
    data["comments"] = prior + data["comments"]
    return data


class CodexAdvisoryTests(unittest.TestCase):
    assert_approved = approval.CodexApprovalTests.assert_approved
    assert_withheld = approval.CodexApprovalTests.assert_withheld

    def test_setup_advisory_does_not_block_completed_current_review(self):
        for body in ["@codex review", "@codex review\n\nPlease review the current HEAD."]:
            with self.subTest(body=body):
                data = with_advisory()
                data["comments"][0]["body"] = body
                result = approval.execute(data)
                self.assert_approved(result)
                self.assertNotIn(ADVISORY, result["stdout"] + result["summary"])

    def test_setup_advisory_does_not_hide_completed_prior_cycle(self):
        self.assert_approved(approval.execute(with_prior_cycle()))

    def test_advisory_cannot_replace_either_completion_receipt(self):
        for missing in [2, 3]:
            with self.subTest(missing=missing):
                data = with_advisory()
                del data["comments"][missing]
                self.assert_withheld(approval.execute(data), "completion receipts")

    def test_prior_cycle_receipts_do_not_invalidate_completed_current_head(self):
        data = with_prior_cycle()
        del data["comments"][3]
        self.assert_approved(approval.execute(data))

    def test_duplicate_clean_receipt_for_same_head_is_accepted(self):
        data = with_advisory()
        body = data["comments"][2]["body"]
        data["comments"].append(approval.comment(6, body, "2026-10-31T11:31:07Z"))
        self.assert_approved(approval.execute(data))

    def test_latest_same_head_receipt_with_findings_withholds(self):
        data = with_advisory()
        body = data["comments"][2]["body"].replace("Didn't find any major issues.", "Found a major issue.")
        data["comments"].append(approval.comment(6, body, "2026-10-31T11:31:07Z"))
        self.assert_withheld(approval.execute(data), "no findings")

    def test_unrelated_bot_notices_do_not_replace_review_evidence(self):
        for body in [ADVISORY + "\nMore information.", "Review service setup notice."]:
            with self.subTest(body=body):
                data = with_advisory()
                data["comments"][-1]["body"] = body
                self.assert_approved(approval.execute(data))

    def test_edited_or_undated_advisory_is_ignored(self):
        for created, updated in [("2026-10-31T11:30:20Z", "2026-10-31T11:30:21Z"), (None, None)]:
            with self.subTest(created=created):
                data = with_advisory()
                data["comments"][-1].update(created_at=created, updated_at=updated)
                self.assert_approved(approval.execute(data))

    def test_advisory_cannot_replace_trusted_clean_review_evidence(self):
        for missing in ["summary", "receipt", "reaction", "completed", "head", "clean"]:
            with self.subTest(missing=missing):
                data = with_advisory()
                if missing in ("summary", "receipt"):
                    index = 1 if missing == "summary" else 3
                    data["comments"][index]["performed_via_github_app"]["id"] = 1
                elif missing == "reaction":
                    data["reactions"] = []
                else:
                    old, new = {
                        "completed": ('"status": "completed"', '"status": "running"'),
                        "head": (approval.HEAD, "c" * 40),
                        "clean": ('"has_unresolved_findings": false', '"has_unresolved_findings": true'),
                    }[missing]
                    data["comments"][1]["body"] = data["comments"][1]["body"].replace(old, new)
                self.assert_withheld(approval.execute(data))

    def test_advisory_is_still_revalidated_before_approval(self):
        for mutation in ["edit", "delete", "insert", "identity"]:
            with self.subTest(mutation=mutation):
                def change(endpoint, count, data):
                    if endpoint.endswith("/comments") and count == 2:
                        if mutation == "edit":
                            data["comments"][-1]["body"] += "\nChanged notice"
                        elif mutation == "delete":
                            data["comments"].pop()
                        elif mutation == "insert":
                            data["comments"].append(approval.comment(6, ADVISORY, "2026-10-31T11:30:21Z"))
                        else:
                            data["comments"][-1]["performed_via_github_app"]["id"] = 1
                self.assert_withheld(approval.execute(with_advisory(), before_read=change))


if __name__ == "__main__":
    unittest.main()
