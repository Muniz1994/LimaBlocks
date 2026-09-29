from django.test import TestCase

from .models import Regulation, Rule


def _rule(name):

    return Rule.objects.create(name=name, text='', external_reference='')


class DeleteTests(TestCase):

    def test_deleting_a_regulation_removes_its_rules(self):
        regulation = Regulation.objects.create(name='Code')
        regulation.rules.add(_rule('A'), _rule('B'))

        response = self.client.delete(f'/api/regulations/{regulation.id}/')

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Regulation.objects.exists())
        self.assertFalse(Rule.objects.exists())

    def test_a_rule_shared_with_another_regulation_is_kept(self):
        shared = _rule('Shared')
        doomed = Regulation.objects.create(name='Doomed')
        kept = Regulation.objects.create(name='Kept')
        doomed.rules.add(shared, _rule('Own'))
        kept.rules.add(shared)

        self.client.delete(f'/api/regulations/{doomed.id}/')

        self.assertEqual(list(Rule.objects.all()), [shared])
        self.assertEqual(list(kept.rules.all()), [shared])

    def test_deleting_a_rule_leaves_its_regulation(self):
        regulation = Regulation.objects.create(name='Code')
        rule = _rule('A')
        regulation.rules.add(rule, _rule('B'))

        response = self.client.delete(f'/api/rules/{rule.id}/')

        self.assertEqual(response.status_code, 204)
        self.assertEqual([r.name for r in regulation.rules.all()], ['B'])
