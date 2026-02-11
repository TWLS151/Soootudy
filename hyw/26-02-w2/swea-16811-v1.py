from itertools import combinations


T = int(input())
for test_num in range(1,T+1):
    carrot_num = int(input())
    carrots = list(map(int,input().split()))
    size_of_carrots = sorted(list(set(carrots)))
    # 답 초기화
    answer = -1
    temp = float('inf')
    for sep in combinations(range(len(size_of_carrots)-1),2): #순서대로 있는 당근 사이즈 조합에서 자를 기준선을 선정했습니다. (단 맨 마지막은 제외) 
        # 여기서 순회하며 확인하는 튜플에는 다음의 정보가 담겨있습니다
        # (스몰 사이즈 어디까지?,중간사이즈 어디까지?)
        pass
        small = list(filter(lambda x : x <= size_of_carrots[sep[0]],carrots))
        medium = list(filter(lambda x : x > size_of_carrots[sep[0]] and x <= size_of_carrots[sep[1]],carrots))
        large = list(filter(lambda x : x > size_of_carrots[sep[1]], carrots))
        # print(small)
        # print(medium)
        # print(large)
        # print(carrot_num//2)
        if carrot_num//2 >= len(small) and carrot_num//2 >= len(medium) and carrot_num//2 >= len(large):
            #갯수해당되면
            #최솟값 계산
            temp = min (temp,max(len(small),len(medium),len(large)) - min(len(small),len(medium),len(large)))
            # print(temp)
    if temp != float('inf'):
        answer = temp
    print(f'#{test_num} {answer}')