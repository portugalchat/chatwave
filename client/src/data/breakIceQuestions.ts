export interface BreakIceQuestion {
  id: string;
  question: string;
  options: string[];
  category: 'love_language' | 'apology_language' | 'anger_management';
}

export const BREAK_ICE_QUESTIONS: BreakIceQuestion[] = [
  // LOVE LANGUAGE QUESTIONS
  {
    id: 'love_lang_1',
    question: '🧊 Break the Ice: What is your primary love language?',
    options: [
      'Words of Affirmation',
      'Quality Time',
      'Acts of Service',
      'Physical Touch',
      'Receiving Gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_2',
    question: '🧊 Break the Ice: How do you prefer to show affection?',
    options: [
      'Saying sweet words',
      'Spending uninterrupted time together',
      'Doing helpful tasks',
      'Hugs and gentle touches',
      'Giving thoughtful gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_3',
    question: '🧊 Break the Ice: What makes you feel most loved?',
    options: [
      'Hearing "I love you" and compliments',
      'Having someone\'s full attention',
      'Someone helping with daily tasks',
      'Cuddles and hand-holding',
      'Surprise gifts or flowers'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_4',
    question: '🧊 Break the Ice: In a relationship, what matters most?',
    options: [
      'Regular verbal appreciation',
      'Weekly date nights',
      'Partner helping with chores',
      'Daily physical closeness',
      'Occasional meaningful gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_5',
    question: '🧊 Break the Ice: How do you prefer celebrating anniversaries?',
    options: [
      'Love letters and heartfelt speeches',
      'Uninterrupted day together',
      'Partner planning everything',
      'Romantic physical intimacy',
      'Exchange of special gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_6',
    question: '🧊 Break the Ice: What would hurt your feelings most?',
    options: [
      'Being criticized or ignored verbally',
      'Partner being too busy for you',
      'Partner never helping out',
      'Lack of physical affection',
      'Never receiving thoughtful gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_7',
    question: '🧊 Break the Ice: How do you comfort a sad friend?',
    options: [
      'Tell them encouraging words',
      'Spend time listening to them',
      'Help solve their problems',
      'Give them a warm hug',
      'Bring them a small gift'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_8',
    question: '🧊 Break the Ice: What\'s your ideal romantic gesture?',
    options: [
      'Public declaration of love',
      'Weekend getaway together',
      'Partner cleaning the house',
      'Surprise massage',
      'Jewelry or flowers'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_9',
    question: '🧊 Break the Ice: How do you show appreciation?',
    options: [
      'Say "thank you" with details',
      'Plan special time together',
      'Return the favor with help',
      'Give a grateful hug',
      'Buy a thank-you gift'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_10',
    question: '🧊 Break the Ice: What ruins a romantic moment?',
    options: [
      'Partner not expressing feelings',
      'Constant phone interruptions',
      'Messy or chaotic environment',
      'Partner avoiding physical contact',
      'No effort in presentation'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_11',
    question: '🧊 Break the Ice: How do you prefer receiving compliments?',
    options: [
      'Detailed and specific praise',
      'While having one-on-one time',
      'Through helpful actions',
      'With a gentle touch',
      'Written in a card or note'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_12',
    question: '🧊 Break the Ice: What\'s your perfect date night?',
    options: [
      'Deep conversation and compliments',
      'Phone-free evening together',
      'Partner handling all arrangements',
      'Cozy night with lots of cuddling',
      'Dinner at a special restaurant'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_13',
    question: '🧊 Break the Ice: How do you reconnect after an argument?',
    options: [
      'Talk through feelings honestly',
      'Spend quality time together',
      'Do something helpful for them',
      'Physical reconciliation hug',
      'Make a peace offering gift'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_14',
    question: '🧊 Break the Ice: What makes you feel secure in love?',
    options: [
      'Regular verbal reassurance',
      'Consistent quality time',
      'Partner anticipating your needs',
      'Frequent physical affection',
      'Thoughtful surprises'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_15',
    question: '🧊 Break the Ice: How do you celebrate partner\'s achievements?',
    options: [
      'Praise them enthusiastically',
      'Plan a celebration together',
      'Handle their responsibilities',
      'Give congratulatory hugs',
      'Buy a celebration gift'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_16',
    question: '🧊 Break the Ice: What\'s most important during stressful times?',
    options: [
      'Words of encouragement',
      'Undivided attention and presence',
      'Help with practical matters',
      'Comforting physical touch',
      'Stress-relief gifts or treats'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_17',
    question: '🧊 Break the Ice: How do you prefer morning affection?',
    options: [
      'Sweet good morning texts',
      'Coffee and chat time',
      'Partner making breakfast',
      'Morning cuddles in bed',
      'Surprise coffee delivery'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_18',
    question: '🧊 Break the Ice: What helps you feel appreciated at work?',
    options: [
      'Verbal recognition and praise',
      'One-on-one meetings with boss',
      'Colleagues helping with projects',
      'High-fives and pats on back',
      'Bonus or company gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_19',
    question: '🧊 Break the Ice: How do you prefer long-distance connection?',
    options: [
      'Long phone calls and texts',
      'Video calls and virtual dates',
      'Sending helpful care packages',
      'Planning visits for physical time',
      'Mailing gifts and letters'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_20',
    question: '🧊 Break the Ice: What\'s your ideal birthday celebration?',
    options: [
      'Heartfelt birthday speeches',
      'Day planned just for me',
      'Others handling all the work',
      'Lots of hugs and celebration',
      'Meaningful birthday gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_21',
    question: '🧊 Break the Ice: How do you show love to family?',
    options: [
      'Tell them often you love them',
      'Regular family time together',
      'Help with their problems',
      'Hugs when greeting them',
      'Remember special occasions with gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_22',
    question: '🧊 Break the Ice: What makes you feel closest to someone?',
    options: [
      'Deep, meaningful conversations',
      'Shared experiences and memories',
      'Them helping during tough times',
      'Physical comfort and closeness',
      'Thoughtful gestures and gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_23',
    question: '🧊 Break the Ice: How do you prefer conflict resolution?',
    options: [
      'Open verbal communication',
      'Taking time to talk it through',
      'Working together on solutions',
      'Physical reconciliation',
      'Making amends with gestures'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_24',
    question: '🧊 Break the Ice: What\'s your ideal way to unwind together?',
    options: [
      'Sharing stories about the day',
      'Undisturbed relaxation time',
      'Partner taking care of evening tasks',
      'Physical relaxation together',
      'Enjoying treats or entertainment'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_25',
    question: '🧊 Break the Ice: How do you build emotional intimacy?',
    options: [
      'Sharing feelings and thoughts',
      'Creating special moments together',
      'Supporting each other\'s goals',
      'Physical closeness and touch',
      'Exchanging meaningful tokens'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_26',
    question: '🧊 Break the Ice: What makes you feel truly understood?',
    options: [
      'When someone validates my feelings',
      'When they give me their full attention',
      'When they anticipate my needs',
      'When they comfort me physically',
      'When they surprise me thoughtfully'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_27',
    question: '🧊 Break the Ice: How do you prefer emotional support?',
    options: [
      'Encouraging words and validation',
      'Someone sitting with me quietly',
      'Help solving the problem',
      'Comforting hugs and presence',
      'Bringing comfort items'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_28',
    question: '🧊 Break the Ice: What strengthens your relationships?',
    options: [
      'Regular appreciation and praise',
      'Consistent quality time investment',
      'Mutual help and support',
      'Physical affection and touch',
      'Thoughtful surprises and gifts'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_29',
    question: '🧊 Break the Ice: How do you prefer receiving encouragement?',
    options: [
      'Motivational words and pep talks',
      'Someone spending time to listen',
      'Practical help and assistance',
      'Supportive hugs and presence',
      'Encouraging gifts or cards'
    ],
    category: 'love_language'
  },
  {
    id: 'love_lang_30',
    question: '🧊 Break the Ice: What makes special occasions memorable?',
    options: [
      'Heartfelt words and toasts',
      'Quality time with loved ones',
      'Everything organized perfectly',
      'Warm embraces and celebration',
      'Beautiful gifts and surprises'
    ],
    category: 'love_language'
  },

  // APOLOGY LANGUAGE QUESTIONS
  {
    id: 'apology_1',
    question: '🧊 Break the Ice: When someone hurts you, what apology helps most?',
    options: [
      '"I\'m sorry, I was wrong"',
      '"I\'m sorry, I\'ll make it right"',
      '"I\'m sorry, what can I do?"',
      '"I\'m sorry, I won\'t do it again"',
      '"I\'m sorry, will you forgive me?"'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_2',
    question: '🧊 Break the Ice: What matters most in an apology?',
    options: [
      'Admitting the specific mistake',
      'Promising to make amends',
      'Asking how to fix things',
      'Committing to change behavior',
      'Requesting forgiveness directly'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_3',
    question: '🧊 Break the Ice: When you mess up, how do you apologize?',
    options: [
      'Own up to exactly what I did wrong',
      'Explain how I\'ll fix the damage',
      'Ask what they need from me',
      'Promise it won\'t happen again',
      'Ask if they can forgive me'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_4',
    question: '🧊 Break the Ice: What makes an apology feel genuine?',
    options: [
      'Taking full responsibility',
      'Concrete plans to repair damage',
      'Asking for my input on solutions',
      'Clear commitment to change',
      'Humble request for forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_5',
    question: '🧊 Break the Ice: After being hurt, what helps you heal?',
    options: [
      'Hearing they understand their mistake',
      'Seeing them fix what they broke',
      'Being asked how I want to proceed',
      'Knowing they\'ve learned and grown',
      'Being asked for another chance'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_6',
    question: '🧊 Break the Ice: What apology element is most important?',
    options: [
      'Acknowledgment of wrongdoing',
      'Restitution for the harm',
      'Genuine repentance',
      'Commitment to change',
      'Request for forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_7',
    question: '🧊 Break the Ice: When someone breaks your trust, you need:',
    options: [
      'Them to admit they betrayed you',
      'Them to rebuild what was broken',
      'Them to feel truly sorry',
      'Them to prove they\'ve changed',
      'Them to earn forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_8',
    question: '🧊 Break the Ice: What helps you move past conflict?',
    options: [
      'Clear acknowledgment of fault',
      'Active effort to make things right',
      'Seeing genuine remorse',
      'Evidence of behavioral change',
      'Being asked for a fresh start'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_9',
    question: '🧊 Break the Ice: In a sincere apology, what\'s crucial?',
    options: [
      'No excuses, just owning the mistake',
      'Offering to repair the damage',
      'Showing they feel bad about it',
      'Promising specific changes',
      'Asking for another opportunity'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_10',
    question: '🧊 Break the Ice: What makes you willing to forgive?',
    options: [
      'They fully admit their wrongdoing',
      'They work to fix the consequences',
      'They express genuine regret',
      'They demonstrate real change',
      'They humbly ask for forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_11',
    question: '🧊 Break the Ice: When apologizing to others, you focus on:',
    options: [
      'Clearly stating what you did wrong',
      'Explaining how you\'ll make it right',
      'Expressing how sorry you feel',
      'Outlining your plan to change',
      'Asking if they\'ll give you another chance'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_12',
    question: '🧊 Break the Ice: What type of apology moves you most?',
    options: [
      'One that takes complete responsibility',
      'One that includes fixing the problem',
      'One that shows deep remorse',
      'One that promises lasting change',
      'One that seeks my forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_13',
    question: '🧊 Break the Ice: After an argument, what do you need?',
    options: [
      'Acknowledgment of who was wrong',
      'Action to repair the relationship',
      'Expression of genuine remorse',
      'Commitment to do better',
      'Request to move forward together'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_14',
    question: '🧊 Break the Ice: What makes an apology complete?',
    options: [
      'Full acceptance of responsibility',
      'Plan to make restitution',
      'Demonstration of true regret',
      'Promise of behavior change',
      'Appeal for forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_15',
    question: '🧊 Break the Ice: When someone disappoints you, you want:',
    options: [
      'Them to admit their mistake clearly',
      'Them to fix what went wrong',
      'Them to show they\'re truly sorry',
      'Them to prove they\'ll do better',
      'Them to ask for your forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_16',
    question: '🧊 Break the Ice: What helps restore your faith in someone?',
    options: [
      'They own their mistakes without excuses',
      'They take steps to repair damage',
      'They express heartfelt regret',
      'They show consistent positive change',
      'They seek your permission to continue'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_17',
    question: '🧊 Break the Ice: In conflict resolution, what\'s key?',
    options: [
      'Clear admission of wrongdoing',
      'Concrete corrective action',
      'Authentic expression of sorrow',
      'Believable commitment to improve',
      'Humble request for reconciliation'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_18',
    question: '🧊 Break the Ice: What apology response satisfies you?',
    options: [
      'Direct acknowledgment of their fault',
      'Immediate action to fix things',
      'Visible signs of genuine remorse',
      'Evidence of learning and growth',
      'Sincere plea for forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_19',
    question: '🧊 Break the Ice: When rebuilding trust, what\'s essential?',
    options: [
      'Complete honesty about what happened',
      'Consistent effort to make amends',
      'Ongoing expression of regret',
      'Sustained positive behavior changes',
      'Continued requests for forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_20',
    question: '🧊 Break the Ice: What makes you feel heard in conflict?',
    options: [
      'They acknowledge the specific harm',
      'They work to repair the damage',
      'They validate your hurt feelings',
      'They commit to preventing repetition',
      'They ask for your grace and mercy'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_21',
    question: '🧊 Break the Ice: How do you prefer making peace?',
    options: [
      'Frank discussion of who did what',
      'Collaborative problem-solving',
      'Sharing feelings and regrets',
      'Making promises for the future',
      'Mutual requests for forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_22',
    question: '🧊 Break the Ice: What heals wounded relationships?',
    options: [
      'Truth-telling and responsibility',
      'Reparative actions and effort',
      'Emotional connection and empathy',
      'Growth and positive change',
      'Grace and second chances'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_23',
    question: '🧊 Break the Ice: In your ideal apology, the person:',
    options: [
      'Names exactly what they did wrong',
      'Outlines their plan to make it right',
      'Shows they understand your pain',
      'Demonstrates they\'ve learned from it',
      'Asks humbly for another chance'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_24',
    question: '🧊 Break the Ice: What convinces you someone has changed?',
    options: [
      'They can articulate their mistakes',
      'They actively work to repair harm',
      'They express ongoing remorse',
      'They show sustained new behavior',
      'They continue seeking forgiveness'
    ],
    category: 'apology_language'
  },
  {
    id: 'apology_25',
    question: '🧊 Break the Ice: When forgiving others, you need:',
    options: [
      'Clear understanding of their fault',
      'Evidence of their corrective efforts',
      'Belief in their genuine sorrow',
      'Confidence in their transformation',
      'Their respectful request for mercy'
    ],
    category: 'apology_language'
  },

  // ANGER MANAGEMENT QUESTIONS
  {
    id: 'anger_1',
    question: '🧊 Break the Ice: When you get angry, you typically:',
    options: [
      'Take deep breaths and count to ten',
      'Walk away to cool down',
      'Talk through the issue immediately',
      'Need time alone to process',
      'Express feelings right away'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_2',
    question: '🧊 Break the Ice: What triggers your anger most?',
    options: [
      'Feeling disrespected or dismissed',
      'Unfairness and injustice',
      'Being interrupted or rushed',
      'Broken promises and lies',
      'Feeling overwhelmed or pressured'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_3',
    question: '🧊 Break the Ice: How do you calm down when upset?',
    options: [
      'Practice breathing exercises',
      'Go for a walk or run',
      'Listen to calming music',
      'Write in a journal',
      'Talk to someone I trust'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_4',
    question: '🧊 Break the Ice: What helps you think clearly when angry?',
    options: [
      'Taking a pause before responding',
      'Removing myself from the situation',
      'Asking clarifying questions',
      'Focusing on solutions not blame',
      'Remembering the bigger picture'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_5',
    question: '🧊 Break the Ice: How do you handle anger at work?',
    options: [
      'Take a few minutes to compose myself',
      'Step outside for fresh air',
      'Address the issue professionally',
      'Wait until after work to process',
      'Seek mediation if needed'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_6',
    question: '🧊 Break the Ice: When frustrated, you prefer to:',
    options: [
      'Work through it systematically',
      'Take a break and return later',
      'Vent to someone understanding',
      'Channel energy into physical activity',
      'Find a creative outlet'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_7',
    question: '🧊 Break the Ice: What\'s your anger warning sign?',
    options: [
      'Tension in jaw or shoulders',
      'Feeling hot or flushed',
      'Speaking more quickly',
      'Clenching fists or fidgeting',
      'Heart racing or breathing changes'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_8',
    question: '🧊 Break the Ice: How do you prevent anger escalation?',
    options: [
      'Recognize early warning signs',
      'Use relaxation techniques',
      'Communicate needs clearly',
      'Set healthy boundaries',
      'Practice regular stress management'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_9',
    question: '🧊 Break the Ice: When someone angers you, you:',
    options: [
      'Try to understand their perspective',
      'Take space before responding',
      'Express feelings calmly',
      'Focus on the specific behavior',
      'Look for compromise solutions'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_10',
    question: '🧊 Break the Ice: What helps you recover from anger?',
    options: [
      'Reflecting on what happened',
      'Physical exercise or movement',
      'Talking it through with someone',
      'Practicing forgiveness',
      'Engaging in self-care activities'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_11',
    question: '🧊 Break the Ice: How do you express anger constructively?',
    options: [
      'Use "I" statements not "you" statements',
      'Focus on specific behaviors',
      'Choose the right time and place',
      'Stay calm and respectful',
      'Seek understanding not blame'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_12',
    question: '🧊 Break the Ice: What helps you stay patient?',
    options: [
      'Remembering everyone makes mistakes',
      'Taking deep, slow breaths',
      'Counting to ten before reacting',
      'Thinking of positive outcomes',
      'Practicing mindfulness techniques'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_13',
    question: '🧊 Break the Ice: When you feel anger building:',
    options: [
      'I acknowledge the feeling',
      'I remove myself from triggers',
      'I use coping strategies',
      'I focus on calming thoughts',
      'I seek support if needed'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_14',
    question: '🧊 Break the Ice: How do you handle road rage?',
    options: [
      'Play calming music',
      'Take deep breaths',
      'Give other drivers benefit of doubt',
      'Pull over if too upset',
      'Remind myself it\'s not personal'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_15',
    question: '🧊 Break the Ice: What triggers irritability for you?',
    options: [
      'Lack of sleep or hunger',
      'Feeling rushed or pressured',
      'Dealing with difficult people',
      'Technology not working',
      'Unexpected changes to plans'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_16',
    question: '🧊 Break the Ice: How do you cool down quickly?',
    options: [
      'Splash cold water on face',
      'Count backwards from 100',
      'Visualize a peaceful place',
      'Do progressive muscle relaxation',
      'Call a supportive friend'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_17',
    question: '🧊 Break the Ice: When criticized unfairly, you:',
    options: [
      'Take time to process before responding',
      'Ask for specific examples',
      'Stay focused on the facts',
      'Avoid getting defensive',
      'Seek to understand their perspective'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_18',
    question: '🧊 Break the Ice: What helps you stay calm in conflict?',
    options: [
      'Remembering we\'re on the same team',
      'Focusing on solutions not problems',
      'Taking breaks when needed',
      'Using calm, quiet voice',
      'Looking for common ground'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_19',
    question: '🧊 Break the Ice: How do you manage stress-related anger?',
    options: [
      'Identify and address stress sources',
      'Practice regular relaxation',
      'Maintain healthy routines',
      'Get adequate rest and nutrition',
      'Seek professional help if needed'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_20',
    question: '🧊 Break the Ice: When someone pushes your buttons:',
    options: [
      'I pause and think before reacting',
      'I remove myself from the situation',
      'I use humor to defuse tension',
      'I set clear boundaries',
      'I choose not to take it personally'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_21',
    question: '🧊 Break the Ice: What helps you forgive when angry?',
    options: [
      'Understanding their intentions',
      'Focusing on moving forward',
      'Remembering times I\'ve been forgiven',
      'Seeing the bigger picture',
      'Practicing compassion for their struggle'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_22',
    question: '🧊 Break the Ice: How do you handle anger toward yourself?',
    options: [
      'Practice self-compassion',
      'Learn from the mistake',
      'Talk to myself like a good friend',
      'Focus on growth not perfection',
      'Seek support from others'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_23',
    question: '🧊 Break the Ice: When you feel overwhelmed and angry:',
    options: [
      'Break problems into smaller parts',
      'Prioritize what\'s most important',
      'Ask for help when needed',
      'Take regular breaks',
      'Practice stress-reduction techniques'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_24',
    question: '🧊 Break the Ice: What helps you communicate when angry?',
    options: [
      'Wait until I\'m calmer',
      'Use a respectful tone',
      'Focus on one issue at a time',
      'Listen to understand not defend',
      'Take breaks if discussion heats up'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_25',
    question: '🧊 Break the Ice: How do you rebuild after an angry outburst?',
    options: [
      'Take responsibility for my actions',
      'Apologize sincerely',
      'Learn what triggered the response',
      'Make a plan to handle it better',
      'Seek feedback on how to improve'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_26',
    question: '🧊 Break the Ice: What daily practice helps your anger?',
    options: [
      'Meditation or mindfulness',
      'Regular physical exercise',
      'Journaling thoughts and feelings',
      'Gratitude practice',
      'Adequate sleep and nutrition'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_27',
    question: '🧊 Break the Ice: When you see others getting angry:',
    options: [
      'I stay calm and don\'t escalate',
      'I give them space to cool down',
      'I listen without judging',
      'I offer support if appropriate',
      'I protect my own emotional well-being'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_28',
    question: '🧊 Break the Ice: How do you handle persistent anger?',
    options: [
      'Examine the underlying causes',
      'Seek professional counseling',
      'Practice consistent coping strategies',
      'Address any underlying health issues',
      'Build a strong support network'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_29',
    question: '🧊 Break the Ice: What helps you stay emotionally regulated?',
    options: [
      'Regular self-reflection',
      'Healthy lifestyle choices',
      'Strong social connections',
      'Meaningful work and hobbies',
      'Spiritual or philosophical practices'
    ],
    category: 'anger_management'
  },
  {
    id: 'anger_30',
    question: '🧊 Break the Ice: When facing injustice, you:',
    options: [
      'Channel anger into positive action',
      'Seek constructive ways to address it',
      'Find support from like-minded people',
      'Focus on what you can control',
      'Practice patience with slow change'
    ],
    category: 'anger_management'
  }
];

export function getRandomQuestion(excludeIds: string[] = []): BreakIceQuestion {
  const availableQuestions = BREAK_ICE_QUESTIONS.filter(q => !excludeIds.includes(q.id));
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex] || BREAK_ICE_QUESTIONS[0];
}