namespace TaongaTrackerAPI.Models;

public record FamilyMemberDto()
{
    public int FamilyMemberId;
    public string? UserId;
    public string? FirstName;
    public List<string>? MiddleNames;
    public string? LastName;
    public DateTime? DateOfBirth;
    public DateTime? DateOfDeath;
    public string? Gender;
    public List<int>? ParentsIds;
    public List<int>? ChildrenIds;
    public string? Occupation;
    public string? PlaceOfBirth;
    public string? PlaceOfDeath;
    public string? Nationality;
    public string? Religion;
    public string? MaritalStatus;
    public int? SpouseId;
    public string? RelationshipType;

    public FamilyMemberDto(int familyMemberId, string? userId = null, string? firstName = null, List<string>? middleNames = null, string? lastName = null, DateTime? dateOfBirth = null, DateTime? dateOfDeath = null, string? gender = null, List<int>? parentsIds = null, List<int>? childrenIds = null, string? occupation = null, string? placeOfBirth = null, string? placeOfDeath = null, string? nationality = null, string? religion = null, string? maritalStatus = null, int? spouseId = null, string? relationshipType = null) : this()
    {
        FamilyMemberId = familyMemberId;
        UserId = userId;
        FirstName = firstName;
        MiddleNames = middleNames;
        LastName = lastName;
        DateOfBirth = dateOfBirth;
        DateOfDeath = dateOfDeath;
        Gender = gender;
        ParentsIds = parentsIds;
        ChildrenIds = childrenIds;
        Occupation = occupation;
        PlaceOfBirth = placeOfBirth;
        PlaceOfDeath = placeOfDeath;
        Nationality = nationality;
        Religion = religion;
        MaritalStatus = maritalStatus;
        SpouseId = spouseId;
        RelationshipType = relationshipType;
    }
}