namespace TaongaTrackerAPI.Models;

public class FamilyTree
{
    private int FamilyTreeId;
    private string OwnerUserId;
    private List<FamilyMember>? FamilyMembers;
    private List<string>? SharedWithIds;
    
    public FamilyTree(int familyTreeId, string ownerUserId, List<FamilyMember>? familyMembers = null, List<string>? sharedWithIds = null)
    {
        FamilyTreeId = familyTreeId;
        OwnerUserId = ownerUserId;
        FamilyMembers = familyMembers;
        SharedWithIds = sharedWithIds;
    }

    public FamilyTree(FamilyTreeDto familyTreeDto)
    {
        FamilyTreeId = familyTreeDto.FamilyTreeId;
        OwnerUserId = familyTreeDto.OwnerUserId;
        
        foreach (FamilyMemberDto member in familyTreeDto.FamilyMembers)
        {
            FamilyMembers ??= new List<FamilyMember>();
            FamilyMembers.Add(new FamilyMember(member));
        }
    }

    public Exception? AddMember(FamilyMember familyMember)
    {
        FamilyMembers ??= new List<FamilyMember>();
        
        try {
            FamilyMembers.Add(familyMember);
        }
        catch (Exception? e)
        {
            return e;
        }
        
        return null;
    }

    public Exception? RemoveMember(int familyMemberId)
    {
        if (FamilyMembers == null)
        {
            return new InvalidOperationException("Family tree has no members");
        }
        else if (FamilyMembers.Find(x => x.GetFamilyMemberId() == familyMemberId) == null)
        {
            return new InvalidOperationException("Family member does not exist");
        }
        
        try {
            FamilyMembers.Remove(FamilyMembers.Find(x => x.GetFamilyMemberId() == familyMemberId));
        }
        catch (Exception? e)
        {
            return e;
        }
        
        return null;
    }
}