using TaongaTrackerAPI.Interfaces;

namespace TaongaTrackerAPI.Models;

public class FamilyTree : IShare
{
    private string FamilyTreeId;
    private string OwnerUserId;
    private List<FamilyMember>? FamilyMembers;
    private List<string>? SharedWithIds;
    
    public FamilyTree(string familyTreeId, string ownerUserId, List<FamilyMember>? familyMembers = null, List<string>? sharedWithIds = null)
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

        if (familyTreeDto.SharedWithIds != null)
        {
            FamilyMembers ??= new List<FamilyMember>();
            
            foreach (FamilyMemberDto member in familyTreeDto.FamilyMembers)
            {
                FamilyMembers.Add(new FamilyMember(member));
            }   
        }

        SharedWithIds = familyTreeDto.SharedWithIds;
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

    public Exception? RemoveMember(string familyMemberId)
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
    
    public Exception? ShareWith(string userId)
    {
        return ((IShare)this).ShareWith(userId, ref SharedWithIds);
    }

    public Exception? StopSharingWith(string userId)
    {
        return ((IShare)this).StopSharingWith(userId, ref SharedWithIds);
    }
}