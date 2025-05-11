namespace TaongaTrackerAPI.Models;

public class FamilyMember
{
    private int FamilyMemberId;
    private string? UserId;
    private string? FirstName;
    private List<string>? MiddleNames;
    private string? LastName;
    private DateTime? DateOfBirth;
    private DateTime? DateOfDeath;
    private string? Gender;
    private List<int>? ParentsIds;
    private List<int>? ChildrenIds;
    private string? Occupation;
    private string? PlaceOfBirth;
    private string? PlaceOfDeath;
    private string? Nationality;
    private string? Religion;
    private string? MaritalStatus;
    private int? SpouseId;
    private string? RelationshipType;

    public FamilyMember(int familyMemberId, string? userId = null, string? firstName = null, List<string>? middleNames = null, string? lastName = null, DateTime? dateOfBirth = default, DateTime? dateOfDeath = default, string? gender = null, List<int>? parentsIds = null, List<int>? childrenIds = null, string? occupation = null, string? placeOfBirth = null, string? placeOfDeath = null, string? nationality = null, string? religion = null, string? maritalStatus = null, int? spouseId = default, string? relationshipType = null)
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

    public FamilyMember(FamilyMemberDto familyMemberDto)
    {
        FamilyMemberId = familyMemberDto.FamilyMemberId;
        UserId = familyMemberDto.UserId;
        FirstName = familyMemberDto.FirstName;
        MiddleNames = familyMemberDto.MiddleNames;
        LastName = familyMemberDto.LastName;
        DateOfBirth = familyMemberDto.DateOfBirth;
        DateOfDeath = familyMemberDto.DateOfDeath;
        Gender = familyMemberDto.Gender;
        ParentsIds = familyMemberDto.ParentsIds;
        ChildrenIds = familyMemberDto.ChildrenIds;
        Occupation = familyMemberDto.Occupation;
        PlaceOfBirth = familyMemberDto.PlaceOfBirth;
        PlaceOfDeath = familyMemberDto.PlaceOfDeath;
        Nationality = familyMemberDto.Nationality;
        Religion = familyMemberDto.Religion;
        MaritalStatus = familyMemberDto.MaritalStatus;
        SpouseId = familyMemberDto.SpouseId;
        RelationshipType = familyMemberDto.RelationshipType;
    }
    
    public int GetFamilyMemberId() => FamilyMemberId;
    
    public string? GetUserId() => UserId;
    public void SetUserId(string? value) => UserId = value;
    
    public string? GetFirstName() => FirstName;
    public void SetFirstName(string? value) => FirstName = value;
    
    public List<string>? GetMiddleNames() => MiddleNames;
    public void SetMiddleNames(List<string>? value) => MiddleNames = value;
    
    public string? GetLastName() => LastName;
    public void SetLastName(string? value) => LastName = value;
    
    public DateTime? GetDateOfBirth() => DateOfBirth;
    public void SetDateOfBirth(DateTime? value) => DateOfBirth = value;
    
    public DateTime? GetDateOfDeath() => DateOfDeath;
    public void SetDateOfDeath(DateTime? value) => DateOfDeath = value;
    
    public string? GetGender() => Gender;
    public void SetGender(string? value) => Gender = value;
    
    public List<int>? GetParentsIds() => ParentsIds;
    public void SetParentsIds(List<int>? value) => ParentsIds = value;
    
    public List<int>? GetChildrenIds() => ChildrenIds;
    public void SetChildrenIds(List<int>? value) => ChildrenIds = value;
    
    public string? GetOccupation() => Occupation;
    public void SetOccupation(string? value) => Occupation = value;
    
    public string? GetPlaceOfBirth() => PlaceOfBirth;
    public void SetPlaceOfBirth(string? value) => PlaceOfBirth = value;
    
    public string? GetPlaceOfDeath() => PlaceOfDeath;
    public void SetPlaceOfDeath(string? value) => PlaceOfDeath = value;
    
    public string? GetNationality() => Nationality;
    public void SetNationality(string? value) => Nationality = value;
    
    public string? GetReligion() => Religion;
    public void SetReligion(string? value) => Religion = value;
    
    public string? GetMaritalStatus() => MaritalStatus;
    public void SetMaritalStatus(string? value) => MaritalStatus = value;
    
    public int? GetSpouseId() => SpouseId;
    public void SetSpouseId(int? value) => SpouseId = value;
    
    public string? GetRelationshipType() => RelationshipType;
    public void SetRelationshipType(string? value) => RelationshipType = value;
}