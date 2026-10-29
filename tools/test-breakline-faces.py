#!/usr/bin/env python3
import unittest
from breakline_faces import derive_faces

class BreaklineFacesTest(unittest.TestCase):
    def test_narrow_high_line_is_retained_and_formline_ignored(self):
        scenario={'grid':{'width':4,'height':4,'cellSize':4},'bed':[0]*16,'breaklines':[{'type':1,'points':[[8,0,2],[8,16,2]]},{'type':2,'points':[[4,0,3],[4,16,3]]}]}
        faces=derive_faces(scenario)
        self.assertEqual([f['index'] for f in faces],[2,7,12,17])
        self.assertTrue(all(f['axis']=='x' and f['crest']==2 for f in faces))
    def test_line_below_cell_bed_does_not_add_artificial_dam(self):
        scenario={'grid':{'width':4,'height':4,'cellSize':4},'bed':[2]*16,'breaklines':[{'type':1,'points':[[8,0,1],[8,16,1]]}]}
        self.assertEqual(derive_faces(scenario),[])

if __name__=='__main__':unittest.main()
