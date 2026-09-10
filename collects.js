const bcpCollects = {
    "Advent1": {
        collect: "<h3>The First Sunday in Advent</h3><p>Almighty God, give us grace that we may cast away the works of darkness, and put upon us the armour of light, now in the time of this mortal life, in which thy Son Jesus Christ came to visit us in great humility; that in the last day, when he shall come again in his glorious Majesty, to judge both the quick and the dead, we may rise to the life immortal; through him who liveth and reigneth with thee and the Holy Ghost, now and ever. Amen.</p>",
        mpFirst: "Isaiah 1",
        epFirst: "Isaiah 2"
        // Notice we don't list Second Lessons here. The app will just use the standard ones!
    },
    
    "AshWednesday": {
        collect: "<h3>Ash Wednesday</h3><p>Almighty and everlasting God, who hatest nothing that thou hast made, and dost forgive the sins of all them that are penitent: Create and make in us new and contrite hearts, that we worthily lamenting our sins, and acknowledging our wretchedness, may obtain of thee, the God of all mercy, perfect remission and forgiveness; through Jesus Christ our Lord. Amen.</p>",
        mpPsalms: "<h3>Proper Psalms</h3><p><b>Psalm 6.</b> <i>Domine, ne in furore.</i><br>O Lord, rebuke me not in thine indignation... <i>[Add Ps 32 and 38 here]</i></p>",
        epPsalms: "<h3>Proper Psalms</h3><p><b>Psalm 102.</b> <i>Domine, exaudi.</i><br>Hear my prayer, O Lord... <i>[Add Ps 130 and 143 here]</i></p>"
        // When Ash Wednesday rolls around, the app will inject these specific Psalms instead of the Day of the Month.
    },
    
    // A standard Sunday with no proper Psalms, but proper First Lessons
    "Trinity1": {
        collect: "<h3>The First Sunday after Trinity</h3><p>O God, the strength of all them that put their trust in thee...</p>",
        mpFirst: "Joshua 10",
        epFirst: "Joshua 23"
    },

    "Default": {
        collect: "<h3>The Collect of the Day</h3><p><i>[Collect text missing from collects.js]</i></p>"
    }
};
